/*! Module dependencies */
var mssql = require("mssql");
var SqlConnector = require('loopback-connector').SqlConnector;
var util = require("util");
var async = require('async');
var debug = require('debug')('loopback:connector:mssql');

var name = "mssql";

exports.name = name;
exports.initialize = function initializeSchema(dataSource, callback) {

  var settings = dataSource.settings || {};
  debug('Settings: %j', settings);
  var driver = new MsSQL(settings);
  dataSource.connector = driver;
  driver.connect(function(err, connection) {
    dataSource.client = connection;
    dataSource.connector.dataSource = dataSource;
    dataSource.connector.tableNameID = dataSource.settings.tableNameID;
    callback && callback(err, connection);
  });
};

function MsSQL(settings) {
  MsSQL.super_.call(this, name, settings);
  // this.name = name;
  // this.settings = settings || {};
  this.settings.server = this.settings.host || this.settings.hostname;
  this.settings.user = this.settings.user || this.settings.username;
  this._models = {};
  this._idxNames = {};
}

util.inherits(MsSQL, SqlConnector);

MsSQL.newline = "\r\n";

/*!
 * This is a workaround to the limitation that 'msssql' driver doesn't support
 * parameterized SQL execution
 * @param {String} sql The SQL string with parameters as (?)
 * @param {*[]) params An array of parameter values
 * @returns {*} The fulfilled SQL string
 */
function format(sql, params) {
  if (Array.isArray(params)) {
    var count = 0;
    var index = -1;
    while (count < params.length) {
      index = sql.indexOf('(?)');
      if (index === -1) {
        return sql;
      }
      sql = sql.substring(0, index) + params[count] + sql.substring(index + 3);
      count++;
    }
  }
  return sql;
}

MsSQL.prototype.connect = function(callback) {
  var self = this;
  if(self.client) {
    return process.nextTick(callback);
  }
  var connection = new mssql.Connection(this.settings, function (err) {
    if (err) {
      debug('Connection error: ', err);
      return callback(err);
    }
    debug('Connection established: ', self.settings.server);
    self.client = connection;
    callback(err, connection);
  });
};

MsSQL.prototype.query = function (sql, optionsOrCallback, callback) {
  //debugger;
  var hasOptions = true;
  var options = null;
  var cb = null;
  if (typeof optionsOrCallback === "function") {
    hasOptions = false;
    cb = optionsOrCallback;
  } else {
    options = optionsOrCallback;
    cb = callback;
  }
  if(hasOptions) {
    sql = format(sql, options);
  }
  debug('SQL: %s %j', sql, options);
  if (!this.dataSource.connected) {
    return this.dataSource.once('connected', function () {
      this.query(sql, cb);
    }.bind(this));
  }
  var time = Date.now();
  var log = this.log;
  if (typeof cb !== 'function') {
    throw new Error('callback should be a function');
  }

  var innerCB = function (err, data) {
    debug('Result: %j %j', err, data);
    if (log) {
      log(sql, time);
    }
    cb && cb(err, data);
  };

  var request = new mssql.Request(this.client);
  // request.verbose = true;
  request.query(sql, innerCB);
};

MsSQL.prototype.disconnect = function disconnect() {
  this.client.close();
};

// MsSQL.prototype.command = function (sql, callback) {
//     return this.query(sql, callback);
// };

//params
// descr = {
//   model: ...
//   properties: ...
//   settings: ...
// }
MsSQL.prototype.define = function (modelDefinition) {
  if (!modelDefinition.settings) {
    modelDefinition.settings = {};
  }

  this._models[modelDefinition.model.modelName] = modelDefinition;


  //track database index names for this model
  this._idxNames[modelDefinition.model.modelName] = [];
};

// MsSQL.prototype.defineProperty = function (model, prop, params) {
//   this._models[model].properties[prop] = params;
// };

/**
 * Must invoke callback(err, id)
 */
MsSQL.prototype.create = function (model, data, callback) {
  //debugger;
  var fieldsAndData = this.buildInsert(model, data);
  var tblName = this.tableEscaped(model);
  var sql = "INSERT INTO " + tblName + " (" + fieldsAndData.fields + ")" + MsSQL.newline;
  sql += "VALUES (" + fieldsAndData.paramPlaceholders + ");" + MsSQL.newline;
  sql += "SELECT IDENT_CURRENT('" + tblName + "') AS insertId;";

  this.query(sql, fieldsAndData.params, function (err, results) {
    if (err) {
      return callback(err);
    }
    //msnodesql will execute the callback for each statement that get's executed, we're only interested in the one that returns with the insertId
    if (results.length > 0 && results[0].insertId) {
      callback(null, results[0].insertId);
    }
  });
};

MsSQL.prototype.updateOrCreate = function (model, data, callback) {
  var self = this;
  var props = this._models[model].properties;
  var tblName = this.tableEscaped(model);
  var modelPKID = this.idName(model);
  //get the correct id of the item using the pkid that they specified
  var id = data[modelPKID];
  var fieldNames = [];
  var fieldValues = [];
  var fieldValuesPlaceholders = [];
  var combined = [];
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      //check for the "id" key also, for backwards compatibility with the jugglingdb hardcoded id system
      if (key !== "id" && key !== modelPKID) {
        fieldNames.push("[" + key + "]");
        fieldValues.push(self.toDatabase(props[key], data[key], true));
        fieldValuesPlaceholders.push("(?)");
        combined.push(key + "=(?)");
      }
    }
  });
  var sql = "";
  if (id > 0) {
    self.exists(model, id, function (err, yn) {
      if (err) {
        return callback(err);
      }
      if (yn) {
        //update
        sql = "UPDATE " + tblName + MsSQL.newline;
        sql += "SET " + combined.join() + MsSQL.newline;
        sql += "WHERE [" + modelPKID + "] = (?);" + MsSQL.newline;
        sql += "SELECT " + id + " AS pkid;";
        fieldValues.push(id);
      } else {
        //insert with identity_insert
        sql = "SET IDENTITY_INSERT " + tblName + " ON;" + MsSQL.newline;
        sql += "INSERT INTO " + tblName + " ([" + modelPKID + "],"
          + fieldNames.join() + ")" + MsSQL.newline;
        sql += "VALUES (" + id + "," + fieldValuesPlaceholders.join() + ");" + MsSQL.newline;
        sql += "SET IDENTITY_INSERT " + tblName + " OFF;" + MsSQL.newline;
        sql += "SELECT " + id + " AS pkid;";
      }
      doQuery(sql, fieldValues);
    });
  } else {
    //insert
    sql = "INSERT INTO " + tblName + " (" + fieldNames.join() + ")" + MsSQL.newline;
    sql += "VALUES (" + fieldValuesPlaceholders.join() + ");" + MsSQL.newline;
    sql += "SELECT IDENT_CURRENT('" + tblName + "') AS pkid;";
    doQuery(sql, fieldValues);
  }

  var doQuery = function (sql, fieldValues) {
    self.query(sql, fieldValues, function (err, results) {
      if (err) {
        return callback(err);
      }
      //msnodesql will execute the callback for each statement that get's
      // executed, we're only interested in the one that returns with the pkid
      if (results.length > 0 && results[0].pkid) {
        data[modelPKID] = results[0].pkid;
        //#jdb id compatibility#
        data.id = results[0].pkid; //set the id property also, to play nice
        // with the jugglingdb abstract class implementation.
        callback(err, data);
      }
    });
  };
};

//redundant, same functionality as "updateOrCreate" right now.  Maybe in the
// future some validation will happen here.
MsSQL.prototype.save = function (model, data, callback) {
  this.updateOrCreate(model, data, callback);
};

MsSQL.prototype.updateAttributes = function (model, id, data, cb) {
  var self = this;
  var tblName = this.tableEscaped(model);
  var modelPKID = this.idName(model);
  //jugglingdb abstract class may have sent up a null value for this id if we
  // aren't using the standard "id" name for the pkid.
  //  if that is the case then set the id to the correct value from the data
  // using the actual pkid name.
  if (id === null) {
    id = data[modelPKID];
  } else {
    data[modelPKID] = id;
  }
  this.exists(model, id, function (err, yn) {
    if (err) {
      debug(err);
      return cb && cb("An error occurred when checking for the existance of this record");
    }
    if (yn) {
      //only call this after verifying that the record exists, we don't want to create it if it doesn't.
      return self.updateOrCreate(model, data, cb);
    }
    return cb && cb("A " + tblName + " doesn't exist with a " + modelPKID
      + " of " + id, id);
  });
};

MsSQL.prototype.exists = function (model, id, callback) {
  var tblName = this.tableEscaped(model);
  var modelPKID = this.idName(model);
  var sql = "SELECT COUNT(*) cnt FROM " + tblName + " WHERE [" + modelPKID + "] = (?)"
  this.query(sql, [id], function (err, results) {
    if (err) return callback(err);
    callback(null, results[0].cnt >= 1);
  });
};

MsSQL.prototype.count = function (model, cb, where) {
  var sql = "SELECT COUNT(*) cnt FROM " + this.tableEscaped(model) + MsSQL.newline;

  if (where !== null) {
    sql += this.buildWhere(model, where) + MsSQL.newline;
  }

  this.query(sql, function (err, data) {
    if (err) {
      return cb && cb(err);
    }
    cb && cb(null, data[0].cnt);
  });

  return sql;
};


MsSQL.prototype.destroyAll = function (model, where, cb) {
  if (!cb && 'function' === typeof where) {
    cb = where;
    where = undefined;
  }
  this.query('DELETE FROM '
    + this.tableEscaped(model) + ' ' + this.buildWhere(model, where || {}),
    function (err, data) {
    cb && cb(err, data);
  }.bind(this));

};

MsSQL.prototype.destroy = function (model, id, cb) {
  var sql = "DELETE FROM " + this.tableEscaped(model) + MsSQL.newline;
  sql += "WHERE [" + this.idName(model) + "] = (?)";
  this.query(sql, [id], function (err, data) {
    if (err) {
      return cb && cb(err);
    }
    cb && cb(null);
  });
};

MsSQL.prototype.update = MsSQL.prototype.updateAll = function (model, where, data, cb) {
  var self = this;
  var props = this._models[model].properties;
  var tblName = this.tableEscaped(model);
  var modelPKID = this.idName(model);
  //get the correct id of the item using the pkid that they specified
  var id = data[modelPKID];
  var fieldNames = [];
  var fieldValues = [];
  var fieldValuesPlaceholders = [];
  var combined = [];
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      //check for the "id" key also, for backwards compatibility with the jugglingdb hardcoded id system
      if (key !== "id" && key !== modelPKID) {
        fieldNames.push("[" + key + "]");
        fieldValues.push(self.toDatabase(props[key], data[key], true));
        fieldValuesPlaceholders.push("(?)");
        combined.push(key + "=(?)");
      }
    }
  });
  var sql = "";

  //update
  sql = "UPDATE " + tblName + MsSQL.newline;
  sql += "SET " + combined.join() + MsSQL.newline;
  sql += self.buildWhere(model, where) + MsSQL.newline;
  fieldValues.push(id);

  self.query(sql, fieldValues, cb);

};


MsSQL.prototype.find = function (model, id, callback) {
  //debugger;
  var tblName = this.tableEscaped(model);
  var modelPKID = this.idName(model);
  var sql = "SELECT * FROM " + tblName + " WHERE [" + modelPKID + "] = (?)";
  this.query(sql, [id], function (err, results) {
    if (err) {
      return callback(err);
    }
    callback(null, this.fromDatabase(model, results[0]));
  }.bind(this));
};

MsSQL.prototype.buildInsert = function (model, data) {
  var insertIntoFields = [];
  var paramPlaceholders = [];
  var params = [];
  var props = this._models[model].properties;
  var modelPKID = this.idName(model);
  //remove the pkid column if it's in the data, since we're going to insert a
  // new record, not update an existing one.
  delete data[modelPKID];
  //delete the hardcoded id property that jugglindb automatically creates
  delete data.id
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      insertIntoFields.push("[" + key + "]");
      paramPlaceholders.push("(?)");
      params.push(this.toDatabase(props[key], data[key], true));
    }
  }.bind(this));

  return { fields: insertIntoFields.join(),
    paramPlaceholders: paramPlaceholders.join(),
    params: params };
}

// Convert to ISO8601 format YYYY-MM-DDThh:mm:ss[.mmm]
function dateToMsSql(val) {

  var dateStr = val.getUTCFullYear() + '-'
    + fillZeros(val.getUTCMonth() + 1) + '-'
    + fillZeros(val.getUTCDate())
    + 'T' + fillZeros(val.getUTCHours()) + ':' +
    fillZeros(val.getUTCMinutes()) + ':' +
    fillZeros(val.getUTCSeconds()) + '.';

  var ms = val.getUTCMilliseconds();
  if (ms < 10) {
    ms = '00' + ms;
  } else if (ms < 100) {
    ms = '0' + ms;
  } else {
    ms = '' + ms;
  }
  return dateStr + ms;

  function fillZeros(v) {
    return v < 10 ? '0' + v : v;
  }
}

//toDatabase is used for formatting data when inserting/updating records
// it is also used when building a where clause for filtering selects
//  in the case of update/insert we want the data to be returned raw
//    because we are using the msnodesql driver's parameterization feature
//  in the case of building a where clause we want to wrap strings in single quotes
//    so they can be concatenated into the sql statement
//  use the 'wrap' parameter to tell the function which case it's handling
// (false=raw, true=single quotes)
MsSQL.prototype.toDatabase = function (prop, val, wrap) {
  if (val === null || val === undefined) {
    // return 'NULL';
    return null;
  }
  if (prop.type && prop.type.modelName) {
    return "'" + JSON.stringify(val) + "'";
  }
  if (val.constructor && val.constructor.name === 'Object') {
    var operator = Object.keys(val)[0]
    val = val[operator];
    if (operator === 'between') {
      //the between operator is never used for insert/updates
      // therefore always pass the wrap=true parameter when formatting the values
      return  this.toDatabase(prop, val[0], true) +
        ' AND ' +
        this.toDatabase(prop, val[1], true);
    } else if (operator === 'inq' || operator === 'nin') {
      //always wrap inq/nin values in single quotes when they are string types,
      // it's never used for insert/updates
      if (!(val.propertyIsEnumerable('length')) && typeof val === 'object'
        && typeof val.length === 'number') { //if value is array
        //check if it is an array of string, because in that cause we need to
        // wrap them in single quotes
        if (typeof val[0] === 'string') {
          return "'" + val.join("','") + "'";
        }
        return val.join(',');
      } else {
        if (typeof val === 'string') {
          val = "'" + val + "'";
        }
        return val;
      }
    } else if (operator === "max") {
      return val.field;
    }
  }
  if (!prop) {
    if (typeof val === 'string' && wrap) {
      val = "'" + val + "'";
    }
    return val;
  }
  if (prop.type.name === 'Number') {
    return val;
  }
  if (prop.type.name === 'Date') {
    if (!val) {
      return null;
      // return 'NULL';
    }
    if (!val.toUTCString) {
      val = new Date(val);
    }
    val = dateToMsSql(val);
    if (wrap) {
      val = "'" + val + "'";
    }
    return val;
  }
  if (prop.type.name === "Boolean") {
    return val ? 1 : 0;
  }

  if (val === null || val === undefined) {
    return val;
  }

  if (wrap) {
    return "'" + val.toString().replace(/'/g, "''") + "'";
  }
  return val.toString();
};

MsSQL.prototype.fromDatabase = function (model, data) {
  if (!data) {
    return null;
  }
  // create an "id" property in the data for backwards compatibility with juggling-db
  // data.id = data[this.idName(model)];
  var props = this._models[model].properties;
  //look for date values in the data, convert them from the database to a javascript date object
  Object.keys(data).forEach(function (key) {
    var val = data[key];
    if (props[key]) {
      if (props[key].type.name === 'Boolean' && val !== null) {
        val = (true && val); //convert to a boolean type from number
      }
      if (props[key].type.name === 'Date' && val !== null) {
        if(!(val instanceof Date)) {
          val = new Date(val.toString());
        }
      }
    }
    data[key] = val;
  });
  return data;
};

MsSQL.prototype.escapeName = function (name) {
  return name.replace(/\./g, '_');
};

MsSQL.prototype.columnEscaped = function (model, property) {
  return '[' + this.escapeName(this.column(model, property)) +']';
};

MsSQL.prototype.schemaName = function (model) {
  // Check if there is a 'schema' property for mssql
  var mssqlMeta = this._models[model].settings && this._models[model].settings.mssql;
  var schemaName = (mssqlMeta && (mssqlMeta.schema || mssqlMeta.schemaName))
    || this.settings.schema || 'dbo';
  return schemaName;
};

MsSQL.prototype.tableEscaped = function (model) {
  return '[' + this.schemaName(model) + '].[' + this.escapeName(this.table(model)) + ']';
};


MsSQL.prototype.escapeKey = function (key) {
  return key;
};

MsSQL.prototype.getColumns = function (model, props) {
  var cols = this._models[model].properties;
  if (!cols) {
    return '*';
  }
  var self = this;
  var keys = Object.keys(cols);
  if (Array.isArray(props) && props.length > 0) {
    // No empty array, including all the fields
    keys = props;
  } else if ('object' === typeof props && Object.keys(props).length > 0) {
    // { field1: boolean, field2: boolean ... }
    var included = [];
    var excluded = [];
    keys.forEach(function (k) {
      if (props[k]) {
        included.push(k);
      } else if ((k in props) && !props[k]) {
        excluded.push(k);
      }
    });
    if (included.length > 0) {
      keys = included;
    } else if (excluded.length > 0) {
      excluded.forEach(function (e) {
        var index = keys.indexOf(e);
        keys.splice(index, 1);
      });
    }
  }
  var names = keys.map(function (c) {
    return self.columnEscaped(model, c);
  });
  return names.join(', ');
};

MsSQL.prototype.all = function (model, filter, callback) {
  var self = this;

  var sql = "SELECT " + this.getColumns(model, filter.fields) +
    " FROM " + this.tableEscaped(model) + MsSQL.newline;

  filter = filter || {};
  if (filter.where) {
    sql += this.buildWhere(model, filter.where) + MsSQL.newline;
  }

  var orderBy = null;
  if (!filter.order) {
    var idNames = this.idNames(model);
    if (idNames && idNames.length) {
      filter.order = idNames;
    }
  }
  if (filter.order) {
    orderBy = this.buildOrderBy(model, filter.order);
    sql += orderBy + MsSQL.newline;
  }
  if (filter.limit || filter.offset || filter.skip) {

    var offset = filter.offset || filter.skip;
    if (isNaN(offset)) {
      offset = 0;
    }
    var limit = filter.limit;
    if (isNaN(limit)) {
      limit = -1;
    }

    if (this.settings.supportsOffsetFetch) {
      // SQL 2012 or later
      // http://technet.microsoft.com/en-us/library/gg699618.aspx
      sql += buildLimit(limit, offset);
    } else {

      // SQL 2005/2008
      // http://blog.sqlauthority.com/2013/04/14/sql-server-tricks-for-row-offset-and-paging-in-various-versions-of-sql-server/

      var paginatedSQL = 'SELECT ' + this.getColumns(model, filter.fields) + MsSQL.newline
        + ' FROM (' + MsSQL.newline
        + ' SELECT ' + this.getColumns(model, filter.fields) + ', ROW_NUMBER() OVER'
        + ' (' + orderBy + ') AS RowNum' + MsSQL.newline
        + ' FROM ' + this.tableEscaped(model) + MsSQL.newline;
      if (filter.where) {
        paginatedSQL += this.buildWhere(model, filter.where) + MsSQL.newline;
      }
      paginatedSQL += ') AS S' + MsSQL.newline
        + ' WHERE S.RowNum > ' + offset;

      if (limit !== -1) {
        paginatedSQL += ' AND S.RowNum <= ' + (offset + limit);
      }

      sql = paginatedSQL + MsSQL.newline;
    }
  }

  this.query(sql, function (err, data) {
    if (err) return callback(err);

    //convert database types to js types
    data = self.fromDatabase(model, data);

    //check for eager loading relationships
    if (filter && filter.include) {
      this._models[model].model.include(data, filter.include, callback);
    } else {
      callback(null, data);
    }
  }.bind(this));

  return sql;
};

MsSQL.prototype.buildOrderBy = function(model, order) {
  var self = this;
  if (typeof order === 'string') {
    order = [order];
  }
  return 'ORDER BY ' + order.map(function (o) {
    var t = o.split(/[\s,]+/);
    if (t.length === 1) {
      return self.columnEscaped(model, o);
    }
    return self.columnEscaped(model, t[0]) + ' ' + t[1];
  }).join(', ');
};

function buildLimit(limit, offset) {
  if (isNaN(offset)) {
    offset = 0;
  }
  var sql = 'OFFSET ' + offset + ' ROWS';
  if (limit >= 0) {
    sql += ' FETCH NEXT ' + limit + ' ROWS ONLY';
  }
  return sql;
}

MsSQL.prototype._buildWhere = function (model, conds) {
  if (!conds) {
    return null;
  }
  var self = this;
  var props = this._models[model].properties;
  var cs = [];
  Object.keys(conds).forEach(function (key) {
    if (key === 'and' || key === 'or') {
      var clauses = conds[key];
      if (Array.isArray(clauses)) {
        clauses = clauses.map(function (c) {
          return '(' + self._buildWhere(model, c) + ')';
        });
        cs.push(clauses.join(' ' + key.toUpperCase() + ' '));
        return;
      }
      // The value is not an array, fall back to regular fields
    }
    var keyEscaped = self.escapeKey(key);
    if (props[key]) {
      keyEscaped = self.columnEscaped(model, key);
    }
    var val = self.toDatabase(props[key], conds[key], true);
    if (conds[key] === null) {
      cs.push(keyEscaped + ' IS NULL');
    } else if (conds[key].constructor.name === 'Object') {
      var condType = Object.keys(conds[key])[0];
      var sqlCond = keyEscaped;
      if ((condType === 'inq' || condType === 'nin') && val.length === 0) {
        cs.push(condType === 'inq' ? 0 : 1);
        return true;
      }
      if (condType === "max") {
        var tbl = conds[key].max.from;
        var subClause = conds[key].max.where;
        sqlCond += " = (SELECT MAX(" + val + ") FROM " + tbl;
        if (subClause) {
          sqlCond += " " + self._buildWhere(model, subClause);
        }
        sqlCond += ")";
        cs.push(sqlCond);
        return true;
      }
      switch (condType) {
        case 'gt':
          sqlCond += ' > ';
          break;
        case 'gte':
          sqlCond += ' >= ';
          break;
        case 'lt':
          sqlCond += ' < ';
          break;
        case 'lte':
          sqlCond += ' <= ';
          break;
        case 'between':
          sqlCond += ' BETWEEN ';
          break;
        case 'inq':
          sqlCond += ' IN ';
          break;
        case 'nin':
          sqlCond += ' NOT IN ';
          break;
        case 'neq':
          sqlCond += ' != ';
          break;
        case 'like':
          sqlCond += ' LIKE ';
          val += " ESCAPE '\\'";
          break;
        case 'nlike':
          sqlCond += ' NOT LIKE ';
          val += " ESCAPE '\\'";
          break;
      }
      sqlCond += (condType === 'inq' || condType === 'nin') ? '(' + val + ')' : val;
      cs.push(sqlCond);
    } else {
      cs.push(keyEscaped + ' = ' + val);
    }
  });
  if (cs.length === 0) {
    return '';
  }
  return cs.join(' AND ');
};

MsSQL.prototype.buildWhere = function (model, conds) {
  var where = this._buildWhere(model, conds);
  return where? 'WHERE ' + where : '';
};

MsSQL.prototype.showFields = function (model, cb) {
  var sql = 'select [COLUMN_NAME] as [Field], '
    + ' [IS_NULLABLE] as [Null], [DATA_TYPE] as [Type],'
    + ' [CHARACTER_MAXIMUM_LENGTH] as [Length],'
    + ' [NUMERIC_PRECISION] as [Precision], NUMERIC_SCALE as [Scale]'
    + ' from INFORMATION_SCHEMA.COLUMNS'
    + ' where [TABLE_SCHEMA] = \'' + this.schemaName(model) + '\''
    + ' and [TABLE_NAME] = \'' + this.escapeName(this.table(model)) + '\''
    + ' order by [ORDINAL_POSITION]'
  this.query(sql, function (err, fields) {
    if (err) {
      return cb && cb(err);
    } else {
      if (Array.isArray(fields)) {
        fields.forEach(function (f) {
          if (f.Length) {
            f.Type = f.Type + '(' + f.Length + ')';
          } else if (f.Precision) {
            f.Type = f.Type + '(' + f.Precision, +',' + f.Scale + ')';
          }
        });
      }
      cb && cb(err, fields);
    }
  });
};

MsSQL.prototype.showIndexes = function (model, cb) {
  // TODO: [rfeng] Implement SHOW INDEXES
  /*
  var schema = "'" + this.schemaName(model) +"'";
  var table = "'" + this.escapeName(this.table(model)) +"'";
  var sql = "SELECT OBJECT_SCHEMA_NAME(T.[object_id],DB_ID()) AS [table_schema],"
  + " T.[name] AS [table_name], I.[name] AS [index_name], AC.[name] AS [column_name],"
  + " I.[type_desc], I.[is_unique], I.[data_space_id], I.[ignore_dup_key], I.[is_primary_key],"
  + " I.[is_unique_constraint], I.[fill_factor], I.[is_padded], I.[is_disabled], I.[is_hypothetical],"
  + " I.[allow_row_locks], I.[allow_page_locks], IC.[is_descending_key], IC.[is_included_column]"
  + " FROM sys.[tables] AS T"
  + " INNER JOIN sys.[indexes] I ON T.[object_id] = I.[object_id]"
  + " INNER JOIN sys.[index_columns] IC ON I.[object_id] = IC.[object_id]"
  + " INNER JOIN sys.[all_columns] AC ON T.[object_id] = AC.[object_id] AND IC.[column_id] = AC.[column_id]"
  + " WHERE T.[is_ms_shipped] = 0 AND I.[type_desc] <> 'HEAP'"
  + " AND OBJECT_SCHEMA_NAME(T.[object_id],DB_ID()) = " + schema + " AND T.[name] = " + table
  + " ORDER BY T.[name], I.[index_id], IC.[key_ordinal]";

  this.query(sql, function (err, fields) {
    cb && cb(err, fields);
  });
  */

  process.nextTick(function () {
    cb && cb(null, []);
  });
};

MsSQL.prototype.autoupdate = function(models, cb) {
  var self = this;
  if ((!cb) && ('function' === typeof models)) {
    cb = models;
    models = undefined;
  }
  // First argument is a model name
  if ('string' === typeof models) {
    models = [models];
  }

  models = models || Object.keys(this._models);
  async.each(models, function(model, done) {
    if (!(model in self._models)) {
      return process.nextTick(function() {
        done(new Error('Model not found: ' + model));
      });
    }
    self.showFields(model, function(err, fields) {
      self.showIndexes(model, function(err, indexes) {
        if (!err && fields.length) {
          self.alterTable(model, fields, indexes, done);
        } else {
          self.createTable(model, done);
        }
      });
    });
  }, cb);
};

MsSQL.prototype.isActual = function (cb) {
  var ok = false;
  var self = this;
  async.each(Object.keys(this._models), function(model, done) {
    self.showFields(model, function (err, fields) {
      self.showIndexes(model, function (err, indexes) {
        self.alterTable(model, fields, indexes, function(err, needAlter) {
          if (err) {
            return done(err);
          } else {
            ok = ok || needAlter;
            done(err);
          }
        }, true);
      });
    });
  }, function(err) {
    if (err) {
      return err;
    }
    cb(null, !ok);
  });
};

MsSQL.prototype.alterTable = function (model, actualFields, actualIndexes, done, checkOnly) {
  var self = this;
  var m = this._models[model];
  var idName = this.idName(model);

  var propNames = Object.keys(m.properties).filter(function (name) {
    return !!m.properties[name];
  });
  var indexNames = m.settings.indexes ? Object.keys(m.settings.indexes).filter(function (name) {
    return !!m.settings.indexes[name];
  }) : [];
  var sql = [];
  var ai = {};

  if (actualIndexes) {
    actualIndexes.forEach(function (i) {
      var name = i.Key_name;
      if (!ai[name]) {
        ai[name] = {
          info: i,
          columns: []
        };
      }
      ai[name].columns[i.Seq_in_index - 1] = i.Column_name;
    });
  }
  var aiNames = Object.keys(ai);

  var columnsToAdd = [];
  var columnsToDrop = [];
  var columnsToAlter = [];

  // change/add new fields
  propNames.forEach(function (propName) {
    if (propName === idName) return;
    var found;
    actualFields.forEach(function (f) {
      if (f.Field === propName) {
        found = f;
      }
    });

    if (found) {
      actualize(propName, found);
    } else {
      columnsToAdd.push('[' + propName + '] ' + self.propertySettingsSQL(model, propName));
    }
  });

  // drop columns
  actualFields.forEach(function (f) {
    var notFound = !~propNames.indexOf(f.Field);
    if (f.Field === idName) return;
    if (notFound || !m.properties[f.Field]) {
      columnsToDrop.push('[' + f.Field + ']');
    }
  });

  // remove indexes
  aiNames.forEach(function (indexName) {
    if (indexName === idName || indexName === 'PRIMARY') {
      return;
    }
    if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName]
      || m.properties[indexName] && !m.properties[indexName].index) {
      sql.push('DROP INDEX [' + indexName + ']');
    } else {
      // first: check single (only type and kind)
      if (m.properties[indexName] && !m.properties[indexName].index) {
        // TODO
        return;
      }
      // second: check multiple indexes
      var orderMatched = true;
      if (indexNames.indexOf(indexName) !== -1) {
        m.settings.indexes[indexName].columns.split(/,\s*/).forEach(function (columnName, i) {
          if (ai[indexName].columns[i] !== columnName) {
            orderMatched = false;
          }
        });
      }
      if (!orderMatched) {
        sql.push('DROP INDEX [' + indexName + ']');
        delete ai[indexName];
      }
    }
  });

  // add single-column indexes
  propNames.forEach(function (propName) {
    var i = m.properties[propName].index;
    if (!i) {
      return;
    }
    var found = ai[propName] && ai[propName].info;
    if (!found) {
      var type = '';
      var kind = '';
      if (i.type) {
        type = 'USING ' + i.type;
      }
      if (i.kind) {
        // kind = i.kind;
      }
      if (kind && type) {
        sql.push('ADD ' + kind + ' INDEX [' + propName
          + '] ([' + propName + ']) ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX [' + propName + '] '
          + type + ' ([' + propName + ']) ');
      }
    }
  });

  // add multi-column indexes
  indexNames.forEach(function (indexName) {
    var i = m.settings.indexes[indexName];
    var found = ai[indexName] && ai[indexName].info;
    if (!found) {
      var type = '';
      var kind = '';
      if (i.type) {
        type = 'USING ' + i.type;
      }
      if (i.kind) {
        kind = i.kind;
      }
      if (kind && type) {
        sql.push('ADD ' + kind + ' INDEX [' + indexName + '] ('
          + i.columns + ') ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX ' + type + ' [' + indexName
          + '] (' + i.columns + ')');
      }
    }
  });

  var statements = [];
  if (columnsToAdd.length) {
    statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' ADD '
      + columnsToAdd.join(',' + MsSQL.newline));
  }

  if (columnsToAlter.length) {
    // SQL Server doesn't allow multiple columns to be altered in one statement
    columnsToAlter.forEach(function (c) {
      statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' ALTER COLUMN '
        + c);
    });
  }

  if (columnsToDrop.length) {
    statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' DROP COLUMN'
      + columnsToDrop.join(',' + MsSQL.newline));
  }

  async.each(statements, function(query, fn) {
    if (checkOnly) {
      fn(null, true, {statements: statements, query: query});
    } else {
      self.query(query, fn);
    }
  }, function(err, results) {
    done && done(err, results);
  });

  function actualize(propName, oldSettings) {
    var newSettings = m.properties[propName];
    if (newSettings && changed(newSettings, oldSettings)) {
      columnsToAlter.push('[' + propName + '] '
        + self.propertySettingsSQL(model, propName));
    }
  }

  function changed(newSettings, oldSettings) {
    if (oldSettings.Null === 'YES'
      && (newSettings.allowNull === false || newSettings.null === false)) {
      return true;
    }
    if (oldSettings.Null === 'NO' && !(newSettings.allowNull === false
      || newSettings.null === false)) {
      return true;
    }
    if (oldSettings.Type.toUpperCase() !== datatype(newSettings)) {
      return true;
    }
    return false;
  }
};

MsSQL.prototype.propertiesSQL = function (model) {
  // debugger;
  var self = this;
  var objModel = this._models[model];
  var modelPKID = this.idName(model);

  var sql = ["[" + modelPKID + "] [int] IDENTITY(1,1) NOT NULL"];
  Object.keys(objModel.properties).forEach(function (prop) {
    if (prop === modelPKID) {
      return;
    }
    sql.push("[" + prop + "] " + self.propertySettingsSQL(model, prop));
  });
  var joinedSql = sql.join("," + MsSQL.newline + "    ");
  var cmd = "PRIMARY KEY CLUSTERED" + MsSQL.newline + "(" + MsSQL.newline;
  cmd += "    [" + modelPKID + "] ASC" + MsSQL.newline;
  cmd += ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, " +
    "IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON)"

  joinedSql += "," + MsSQL.newline + cmd;

  return joinedSql;
};

MsSQL.prototype.singleIndexSettingsSQL = function (model, prop, add) {
  // Recycled from alterTable single indexes above, more or less.
  var tblName = this.tableEscaped(model);
  var i = this._models[model].properties[prop].index;
  var type = 'ASC';
  var kind = 'NONCLUSTERED';
  var unique = false;
  if (i.type) {
    type = i.type;
  }
  if (i.kind) {
    kind = i.kind;
  }
  if (i.unique) {
    unique = true;
  }
  var name = prop + "_" + kind + "_" + type + "_idx"
  if (i.name) {
    name = i.name;
  }
  this._idxNames[model].push(name);
  var cmd = "CREATE " + (unique ? "UNIQUE " : "") + kind + " INDEX [" + name + "] ON "
    + tblName + MsSQL.newline;
  cmd += "(" + MsSQL.newline;
  cmd += "    [" + prop + "] " + type;
  cmd += MsSQL.newline + ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF," +
    " SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, " +
    "ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);"
    + MsSQL.newline;
  return cmd;
};

MsSQL.prototype.indexSettingsSQL = function (model, prop) {
  // Recycled from alterTable multi-column indexes above, more or less.
  var tblName = this.tableEscaped(model);
  var i = this._models[model].settings.indexes[prop];
  var type = 'ASC';
  var kind = 'NONCLUSTERED';
  var unique = false;
  if (i.type) {
    type = i.type;
  }
  if (i.kind) {
    kind = i.kind;
  }
  if (i.unique) {
    unique = true;
  }
  var splitcolumns = i.columns.split(",");
  var columns = [];
  var name = "";
  splitcolumns.forEach(function (elem, ind) {
    var trimmed = elem.trim();
    name += trimmed + "_";
    trimmed = "[" + trimmed + "] " + type;
    columns.push(trimmed);
  });

  name += kind + "_" + type + "_idx"
  this._idxNames[model].push(name);

  var cmd = "CREATE " + (unique ? "UNIQUE " : "") + kind + " INDEX [" + name + "] ON "
    + tblName + MsSQL.newline;
  cmd += "(" + MsSQL.newline;
  cmd += columns.join("," + MsSQL.newline);
  cmd += MsSQL.newline + ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF, " +
    "SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, " +
    "ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);"
    + MsSQL.newline;
  return cmd;
};

function isNullable(p) {
  return !(p.required || p.id || p.nullable === false ||
    p.allowNull === false || p['null'] === false);
}

MsSQL.prototype.propertySettingsSQL = function (model, prop) {
  var p = this._models[model].properties[prop];
  return this.columnDataType(model, prop) + ' ' +
    (isNullable(p) ? 'NULL' : 'NOT NULL');
};

MsSQL.prototype.automigrate = function(models, cb) {
  var self = this;
  if ((!cb) && ('function' === typeof models)) {
    cb = models;
    models = undefined;
  }
  // First argument is a model name
  if ('string' === typeof models) {
    models = [models];
  }

  models = models || Object.keys(this._models);
  async.each(models, function(model, done) {
    if (!(model in self._models)) {
      return process.nextTick(function() {
        done(new Error('Model not found: ' + model));
      });
    }
    self.dropTable(model, function(err) {
      if (err) {
        return done(err);
      }
      self.createTable(model, done);
    });
  }, function(err) {
    cb && cb(err);
  });
};

MsSQL.prototype.dropTable = function (model, cb) {
  var tblName = this.tableEscaped(model);
  var cmd = "IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'"
    + tblName + "') AND type in (N'U'))";
  cmd += MsSQL.newline + "BEGIN" + MsSQL.newline;
  cmd += "    DROP TABLE " + tblName;
  cmd += MsSQL.newline + "END";
  this.command(cmd, cb);
};

MsSQL.prototype.createTable = function (model, cb) {
  var tblName = this.tableEscaped(model);
  var cmd = "SET ANSI_NULLS ON;" + MsSQL.newline + "SET QUOTED_IDENTIFIER ON;"
    + MsSQL.newline + "SET ANSI_PADDING ON;" + MsSQL.newline;
  cmd += "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'"
    + tblName + "') AND type in (N'U'))" + MsSQL.newline + "BEGIN" + MsSQL.newline;
  cmd += "CREATE TABLE " + this.tableEscaped(model) + " (";
  cmd += MsSQL.newline + "    " + this.propertiesSQL(model) + MsSQL.newline;
  cmd += ")" + MsSQL.newline + "END;" + MsSQL.newline;
  cmd += this.createIndexes(model);
  this.command(cmd, cb);
};

MsSQL.prototype.createIndexes = function (model) {
  var self = this;
  var sql = [];
  // Declared in model index property indexes.
  Object.keys(this._models[model].properties).forEach(function (prop) {
    var i = self._models[model].properties[prop].index;
    if (i) {
      sql.push(self.singleIndexSettingsSQL(model, prop));
    }
  });

  // Settings might not have an indexes property.
  var dxs = this._models[model].settings.indexes;
  if (dxs) {
    Object.keys(this._models[model].settings.indexes).forEach(function (prop) {
      sql.push(self.indexSettingsSQL(model, prop));
    });
  }

  return sql.join(MsSQL.newline);
}

MsSQL.prototype.columnDataType = function (model, property) {
  var columnMetadata = this.columnMetadata(model, property);
  var colType = columnMetadata && columnMetadata.dataType;
  if (colType) {
    colType = colType.toUpperCase();
  }
  var prop = this._models[model].properties[property];
  if (!prop) {
    return null;
  }
  var colLength = columnMetadata && columnMetadata.dataLength || prop.length;
  if (colType) {
    return colType + (colLength ? '(' + colLength + ')' : '');
  }
  return datatype(prop);
};

function datatype(p) {
  var dt = '';
  switch (p.type.name) {
    default:
    case 'String':
    case 'JSON':
      dt = '[nvarchar](' + (p.length || p.limit || 255) + ')';
      break;
    case 'Text':
      dt = '[text]';
      break;
    case 'Number':
      dt = '[int]';
      break;
    case 'Date':
      dt = '[datetime]';
      break;
    case 'Boolean':
      dt = '[bit]';
      break;
    case 'Point':
      dt = '[float]';
      break;
  }
  return dt;
}

MsSQL.prototype.ping = function(cb) {
  this.query('SELECT 1 AS result', cb);
};

require('./discovery')(MsSQL);

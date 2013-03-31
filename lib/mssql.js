/* Module dependencies */
var mssql = require("msnodesql");
var jdb = require("jugglingdb");
var util = require("util");

var name = "mssql";

exports.name = name;
exports.initialize = function initializeSchema(schema, callback) {
  //need msnodesql installed, and a host server and a database
  if (!mssql || !schema.settings.host || !schema.settings.database){ return; }
  
  var conn_str = "Driver={SQL Server Native Client 11.0};Server="+schema.settings.host+";";
  var trusted_str = "Trusted_Connection={Yes};Database={"+schema.settings.database+"};";

  //if we have a username and password then we use a credential connection string
  if (schema.settings.username && schema.settings.password) {
    conn_str += "UID="+schema.settings.username+";PWD="+schema.settings.password+";Database={"+schema.settings.database+"};"
  } else {
    conn_str += trusted_str
  }

  mssql.open(conn_str, function(err, conn){
    if (err)
      throw err

    //debugger;
    schema.client = conn;
    schema.adapter = new MsSQL(schema.client);
    schema.adapter.schema = schema;
    schema.adapter.tableNameID = schema.settings.tableNameID;
    callback();
  });
};

function MsSQL(client) {
  this.name = name;
  this._models = {};
  this._pkids = {};
  this._idxNames = {};
  this.client = client;
}

util.inherits(MsSQL, jdb.BaseSQL);

MsSQL.newline = "\r\n";

MsSQL.prototype.query = function (sql, optionsOrCallback, Callback) {
  //debugger;
  var hasOptions = true;
  var options = null;
  var cb = null;
  if (typeof optionsOrCallback === "function") {
    hasOptions = false;
    cb = optionsOrCallback;
    // console.log(sql);
  } else {
    options = optionsOrCallback;
    cb = Callback;
    // console.log(options);
    // console.log(sql);
  }
  if (!this.schema.connected) {
    return this.schema.on('connected', function () {
      if (hasOptions) {
        this.query(sql, options, cb);
      } else {
        this.query(sql, cb);
      }
    }.bind(this));
  }
  var client = this.client;
  var time = Date.now();
  var log = this.log;
  if (typeof cb !== 'function') {
    throw new Error('callback should be a function');
  }

  var innerCB = function (err, data) {
    if (log) log(sql, time);
    cb(err, data);
  };

  if (hasOptions) {
    this.client.query(sql, options, innerCB);
  } else {
    this.client.query(sql, innerCB);
  }
  
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
MsSQL.prototype.define = function (descr) {
  if (!descr.settings) descr.settings = {};

  this._models[descr.model.modelName] = descr;

  //default pkid is "id"
  var id = "id";
  //override the default with another convention, 'TableName'ID, if defined in the adapter settings
  if (this.tableNameID) {
    id = descr.model.modelName + "ID";
  }
  //override both defaults if a primaryKey is specified in a property
  Object.keys(descr.properties).forEach(function(propName) {
    var propVal = descr.properties[propName];
    if (typeof propVal === "object" && propVal.primaryKey) {
      return id = propName;
    }
  });
  this._pkids[descr.model.modelName] = id;

  //track database index names for this model
  this._idxNames[descr.model.modelName] = [];
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
  var sql = "INSERT INTO [dbo].[" + tblName + "] (" + fieldsAndData.fields + ")" + MsSQL.newline;
      sql += "VALUES (" + fieldsAndData.paramPlaceholders + ");" + MsSQL.newline;
      sql += "SELECT IDENT_CURRENT('" + tblName + "') AS insertId;";
  
  // console.log(sql);
  // console.log(fieldsAndData.params);
  this.query(sql, fieldsAndData.params, function (err, results) {
    //console.log(err);
    if (err) { return callback(err); }
    //console.log(results);
    //msnodesql will execute the callback for each statement that get's executed, we're only interested in the one that returns with the insertId
    if (results.length > 0 && results[0].insertId) {
      //console.log('new id: ' + results[0].insertId);
      callback(null, results[0].insertId);
    }
  });
};

MsSQL.prototype.updateOrCreate = function (model, data, callback) {
  //debugger;
  //console.log('updateOrCreate');
  var self = this;
  var props = this._models[model].properties;
  var tblName = this.tableEscaped(model);
  var modelPKID = this._pkids[model];
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
        fieldValues.push(self.toDatabase(props[key], data[key]));
        fieldValuesPlaceholders.push("(?)");
        combined.push(key + "=(?)");
      }
    }
  });
  var sql = "";
  if (id > 0) {
    self.exists(model, id, function(err, yn) {
      if (err) { return callback(err); }
      if (yn) {
        //update
        sql = "UPDATE [dbo].[" + tblName + "]" + MsSQL.newline;
        sql += "SET " + combined.join() + MsSQL.newline;
        sql += "WHERE [" + modelPKID + "] = (?);" + MsSQL.newline;
        sql += "SELECT " + id + " AS pkid;";
        fieldValues.push(id);
      } else {
        //insert with identity_insert
        sql = "SET IDENTITY_INSERT [dbo].[" + tblName + "] ON;" + MsSQL.newline;
        sql += "INSERT INTO [dbo].[" + tblName + "] ([" + modelPKID + "]," + fieldNames.join() + ")" + MsSQL.newline;
        sql += "VALUES (" + id + "," + fieldValuesPlaceholders.join() + ");" + MsSQL.newline;
        sql += "SET IDENTITY_INSERT [dbo].[" + tblName + "] OFF;" + MsSQL.newline;
        sql += "SELECT " + id + " AS pkid;";
      }
      doQuery(sql, fieldValues);
    });
  } else {
    //insert
    sql = "INSERT INTO [dbo].[" + tblName + "] (" + fieldNames.join() + ")" + MsSQL.newline;
    sql += "VALUES (" + fieldValuesPlaceholders.join() + ");" + MsSQL.newline;
    sql += "SELECT IDENT_CURRENT('" + tblName + "') AS pkid;";
    doQuery(sql, fieldValues);
  }

  var doQuery = function(sql, fieldValues) {
    self.query(sql, fieldValues, function (err, results) {
      if (err) { return callback(err); }
      //msnodesql will execute the callback for each statement that get's executed, we're only interested in the one that returns with the pkid
      if (results.length > 0 && results[0].pkid) {
        data[modelPKID] = results[0].pkid;
        data.id = results[0].pkid;
        callback(err, data);
      }
    });
  }
};

//redundant, same functionality as "updateOrCreate" right now.  Maybe in the future some validation will happen here.
MsSQL.prototype.save = function (model, data, callback) {
  this.updateOrCreate(model, data, callback);
};

MsSQL.prototype.updateAttributes = function (model, id, data, cb) {
  var self = this;
  var tblName = this.tableEscaped(model);
  var modelPKID = this._pkids[model];
  //jugglingdb abstract class may have sent up a null value for this id if we aren't using the standard "id" name for the pkid.
  //  if that is the case then set the id to the correct value from the data using the actual pkid name.
  if (id === null) { 
    id = data[modelPKID];
  } else {
    data[modelPKID] = id;
  }
  //console.log(id);
  this.exists(model, id, function(err, yn) {
    if (err) {
      console.log(err);
      return cb("An error occurred when checking for the existance of this record");
    }
    if (yn) {
      //only call this after verifying that the record exists, we don't want to create it if it doesn't.
      return self.updateOrCreate(model, data, cb);
    }
    return cb("A " + tblName + " doesn't exist with a " + modelPKID + " of " + id , id);
  });
};

MsSQL.prototype.exists = function (model, id, callback) {
  var tblName = this.tableEscaped(model);
  var modelPKID = this._pkids[model];
  var sql = "SELECT COUNT(*) cnt FROM [dbo].[" + tblName + "] WHERE [" + modelPKID + "] = (?)"
  //console.log(sql);
  this.query(sql, [id], function (err, results) {
      if (err) return callback(err);
      callback(null, results[0].cnt >= 1);
  });
};

MsSQL.prototype.count = function (model, cb, where) {
  var sql = "SELECT COUNT(*) cnt FROM [dbo].[" + this.tableEscaped(model) + "]" + MsSQL.newline;
  var props = this._models[model].properties;

  if (where !== null) {
    sql += this.buildWhere(where, props) + MsSQL.newline;
  }

  this.query(sql, function (err, data) {
    if (err) { return cb(err); }
    cb(null, data[0].cnt);
  });

  return sql;
};

MsSQL.prototype.destroyAll = function(model, cb) {
  var sql = "DELETE FROM [dbo].[" + this.tableEscaped(model) + "]";
  this.query(sql, function(err, data) {
    //don't bother returning data, it's a delete statement
    if (err) { return cb(err); }
    cb(null);
  });
};

MsSQL.prototype.destroy = function(model, id, cb) {
  var sql = "DELETE FROM [dbo].[" + this.tableEscaped(model) + "]" + MsSQL.newline;
  sql += "WHERE [" + this._pkids[model] + "] = (?)";
  this.query(sql, [id], function(err, data) {
    if (err) { return cb(err); }
    cb(null);
  });
};

MsSQL.prototype.find = function (model, id, callback) {
  //debugger;
  var tblName = this.tableEscaped(model);
  var modelPKID = this._pkids[model];
  var sql = "SELECT * FROM [dbo].[" + tblName + "] WHERE [" + modelPKID + "] = (?)";
  //console.log(sql);
  this.query(sql, [id], function (err, results) {
    if (err) return callback(err);
    callback(null, this.fromDatabase(model, results[0]));
  }.bind(this));
};

MsSQL.prototype.buildInsert = function (model, data) {
  var insertIntoFields = [];
  var paramPlaceholders = [];
  var params = [];
  var props = this._models[model].properties;
  var modelPKID = this._pkids[model];
  //remove the pkid column if it's in the data, since we're going to insert a new record, not update an existing one.
  delete data[modelPKID];
  //delete the hardcoded id property that jugglindb automatically creates
  delete data.id
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      insertIntoFields.push("[" + key + "]");
      paramPlaceholders.push("(?)");
      params.push(this.toDatabase(props[key], data[key]));
    }
  }.bind(this));

  return { fields:insertIntoFields.join(), paramPlaceholders:paramPlaceholders.join(), params:params };
}

//unchanged from MySql adapter, credit to dgsan
function dateToMsSql(val) {
  return (val.getUTCMonth() + 1) + '-' +
    val.getUTCDate() + '-' +
    val.getUTCFullYear() + ' ' +
    fillZeros(val.getUTCHours()) + ':' +
    fillZeros(val.getUTCMinutes()) + ':' +
    fillZeros(val.getUTCSeconds()) + '.00';

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
//  use the 'wrap' parameter to tell the function which case it's handling (false=raw, true=single quotes)
MsSQL.prototype.toDatabase = function (prop, val, wrap) {
  if (val === null || typeof val === 'undefined') {
    // return 'NULL';
    return null;
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
    } else if (operator == 'inq' || operator == 'nin') {
      //always wrap inq/nin values in single quotes when they are string types, it's never used for insert/updates
      if (!(val.propertyIsEnumerable('length')) && typeof val === 'object' && typeof val.length === 'number') { //if value is array
        //check if it is an array of string, because in that cause we need to wrap them in single quotes
        if (typeof val[0] === 'string') {
          return "'" + val.join("','") + "'";
        }
        return val.join(',');
      } else {
        if (typeof val === 'string')
        {
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
    //return val;
    //console.log('\'' + dateToMsSql(val) + '\'');
    val = dateToMsSql(val);
    if (wrap) {
      val = "'" + val + "'";
    }
    return val;
  }
  if (prop.type.name == "Boolean") {
    return val ? 1 : 0;
  }

  if (wrap) {
    return "'" + val.toString() + "'";
  }
  return val.toString();
};

MsSQL.prototype.fromDatabase = function (model, data) {
  if (!data) {
    return null;
  }
  //create an "id" property in the data for backwards compatibility with juggling-db
  data.id = data[this._pkids[model]];
  var props = this._models[model].properties;
  //look for date values in the data, convert them from the database to a javascript date object
  Object.keys(data).forEach(function (key) {
    var val = data[key];
    if (props[key]) {
      if (props[key].type.name === 'Boolean' && val !== null) {
        val = (true && val); //convert to a boolean type from number
      }
      if (props[key].type.name === 'Date' && val !== null) {
        val = new Date(val.toString().replace(/GMT.*$/, 'GMT'));
      }
    }
    data[key] = val;
  });
  return data;
};

MsSQL.prototype.escapeName = function (name) {
  return name.replace(/\./g, '_');
};

MsSQL.prototype.escapeKey = function (key) {
  return key;
};

MsSQL.prototype.all = function (model, filter, callback) {
  var sql = "SELECT * FROM [dbo].[" + this.tableEscaped(model) + "]" + MsSQL.newline;
  var self = this;
  var props = this._models[model].properties;

  if (filter) {
    if (filter.where) {
      sql += this.buildWhere(filter.where, props) + MsSQL.newline;
      //console.log(sql);
    }

    if (filter.order) {
      sql += this.buildOrderBy(filter.order) + MsSQL.newline;
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

MsSQL.prototype.buildOrderBy = function (order) {
  if (typeof order === 'string') {
    order = [order];
  }
  return 'ORDER BY ' + order.join(',');
};

MsSQL.prototype.buildWhere = function(conds, props) {
  // debugger;
  var self = this;
  var cs = [];
  Object.keys(conds).forEach(function (key) {
    var keyEscaped = self.escapeKey(key);
    var val = self.toDatabase(props[key], conds[key], true);
    if (conds[key] === null) {
      cs.push(keyEscaped + ' IS NULL');
    } else if (conds[key].constructor.name === 'Object') {
      var condType = Object.keys(conds[key])[0];
      var sqlCond = keyEscaped;
      if ((condType == 'inq' || condType == 'nin') && val.length == 0) {
        cs.push(condType == 'inq' ? 0 : 1);
        return true;
      }
      if (condType === "max") {
        var tbl = conds[key].max.from;
        var subClause = conds[key].max.where;
        sqlCond += " = (SELECT MAX(" + val + ") FROM " + tbl;
        if (subClause) {
          sqlCond += " " + self.buildWhere(subClause, props);
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
      }
      sqlCond += (condType == 'inq' || condType == 'nin') ? '(' + val + ')' : val;
      cs.push(sqlCond);
    } else {
      cs.push(keyEscaped + ' = ' + val);
    }
  });
  if (cs.length === 0) {
    return '';
  }
  return 'WHERE ' + cs.join(' AND ');
};

// MsSQL.prototype.autoupdate = function (cb) {
//     var self = this;
//     var wait = 0;
//     Object.keys(this._models).forEach(function (model) {
//         wait += 1;
//         self.query('SHOW FIELDS FROM ' + self.tableEscaped(model), function (err, fields) {
//             self.query('SHOW INDEXES FROM ' + self.tableEscaped(model), function (err, indexes) {
//                 if (!err && fields.length) {
//                     self.alterTable(model, fields, indexes, done);
//                 } else {
//                     self.createTable(model, done);
//                 }
//             });
//         });
//     });

//     function done(err) {
//         if (err) {
//             console.log(err);
//         }
//         if (--wait === 0 && cb) {
//             cb();
//         }
//     }
// };

// MsSQL.prototype.isActual = function (cb) {
//     var ok = false;
//     var self = this;
//     var wait = 0;
//     Object.keys(this._models).forEach(function (model) {
//         wait += 1;
//         self.query('SHOW FIELDS FROM ' + model, function (err, fields) {
//             self.query('SHOW INDEXES FROM ' + model, function (err, indexes) {
//                 self.alterTable(model, fields, indexes, done, true);
//             });
//         });
//     });

//     function done(err, needAlter) {
//         if (err) {
//             console.log(err);
//         }
//         ok = ok || needAlter;
//         if (--wait === 0 && cb) {
//             cb(null, !ok);
//         }
//     }
// };


//not working yet
MsSQL.prototype.alterTable = function (model, actualFields, actualIndexes, done, checkOnly) {
  var self = this;
  var m = this._models[model];
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

  // change/add new fields
  propNames.forEach(function (propName) {
      if (propName === 'id') return;
      var found;
      actualFields.forEach(function (f) {
          if (f.Field === propName) {
              found = f;
          }
      });

      if (found) {
          actualize(propName, found);
      } else {
          sql.push('ADD COLUMN `' + propName + '` ' + self.propertySettingsSQL(model, propName));
      }
  });

  // drop columns
  actualFields.forEach(function (f) {
      var notFound = !~propNames.indexOf(f.Field);
      if (f.Field === 'id') return;
      if (notFound || !m.properties[f.Field]) {
          sql.push('DROP COLUMN `' + f.Field + '`');
      }
  });

  // remove indexes
  aiNames.forEach(function (indexName) {
      if (indexName === 'id' || indexName === 'PRIMARY') return;
      if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] || m.properties[indexName] && !m.properties[indexName].index) {
          sql.push('DROP INDEX `' + indexName + '`');
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
                  if (ai[indexName].columns[i] !== columnName) orderMatched = false;
              });
          }
          if (!orderMatched) {
              sql.push('DROP INDEX `' + indexName + '`');
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
        sql.push('ADD ' + kind + ' INDEX `' + propName + '` (`' + propName + '`) ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX `' + propName + '` ' + type + ' (`' + propName + '`) ');
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
        sql.push('ADD ' + kind + ' INDEX `' + indexName + '` (' + i.columns + ') ' + type);
      } else {
        sql.push('ADD ' + kind + ' INDEX ' + type + ' `' + indexName + '` (' + i.columns + ')');
      }
    }
  });

  if (sql.length) {
    var query = 'ALTER TABLE ' + self.tableEscaped(model) + ' ' + sql.join(',' + MsSQL.newline);
    if (checkOnly) {
      done(null, true, {statements: sql, query: query});
    } else {
      this.query(query, done);
    }
  } else {
    done();
  }

  function actualize(propName, oldSettings) {
    var newSettings = m.properties[propName];
    if (newSettings && changed(newSettings, oldSettings)) {
      sql.push('CHANGE COLUMN `' + propName + '` `' + propName + '` ' + self.propertySettingsSQL(model, propName));
    }
  }

  function changed(newSettings, oldSettings) {
    if (oldSettings.Null === 'YES' && (newSettings.allowNull === false || newSettings.null === false)) return true;
    if (oldSettings.Null === 'NO' && !(newSettings.allowNull === false || newSettings.null === false)) return true;
    if (oldSettings.Type.toUpperCase() !== datatype(newSettings)) return true;
    return false;
  }
};

MsSQL.prototype.propertiesSQL = function (model) {
  // debugger;
  var self = this;
  var objModel = this._models[model];
  var modelPKID = this._pkids[model];

  var sql = ["[" + modelPKID + "] [int] IDENTITY(1,1) NOT NULL"];
  Object.keys(this._models[model].properties).forEach(function (prop) {
    if (prop === modelPKID) {
     return;
    }
    sql.push("[" + prop + "] " + self.propertySettingsSQL(model, prop));
  });
  var joinedSql = sql.join("," + MsSQL.newline + "    ");
  var cmd = "PRIMARY KEY CLUSTERED" + MsSQL.newline + "(" + MsSQL.newline;
  cmd += "    [" + modelPKID + "] ASC" + MsSQL.newline;
  cmd += ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]"
  
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
  this._idxNames[model].push[name];
  var cmd = "CREATE " + (unique ? "UNIQUE " : "") + kind + " INDEX [" + name + "] ON [dbo].[" + tblName + "]" + MsSQL.newline;
      cmd += "(" + MsSQL.newline;
      cmd += "    [" + prop + "] " + type;
      cmd += MsSQL.newline + ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY];" + MsSQL.newline;
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
  splitcolumns.forEach(function(elem, ind) {
    var trimmed = elem.trim();
    name += trimmed + "_";
    trimmed = "[" + trimmed + "] " + type;
    columns.push(trimmed);
  });
  
  name += kind + "_" + type + "_idx"
  this._idxNames[model].push[name];

  var cmd = "CREATE " + (unique ? "UNIQUE " : "") + kind + " INDEX [" + name + "] ON [dbo].[" + tblName + "]" + MsSQL.newline;
      cmd += "(" + MsSQL.newline;
      cmd += columns.join("," + MsSQL.newline);
      cmd += MsSQL.newline + ") WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY];" + MsSQL.newline;
  return cmd;
};

MsSQL.prototype.propertySettingsSQL = function (model, prop) {
  var p = this._models[model].properties[prop];
  return datatype(p) + ' ' +
  (p.allowNull === false || p['null'] === false ? 'NOT NULL' : 'NULL');
};

MsSQL.prototype.automigrate = function (cb) {
  var self = this;
  var wait = 0;
  Object.keys(this._models).forEach(function (model) {
    wait += 1;
    self.dropTable(model, function (err) {
      // console.log('drop', model);
      if (err) console.log(err);
      self.createTable(model, function (err) {
        // console.log('create', model);
        if (err) console.log(err);
        done();
      });
    });
  });
  if (wait === 0) cb();

  function done() {
    if (--wait === 0 && cb) {
        cb();
    }
  }
};

MsSQL.prototype.dropTable = function (model, cb) {
  var tblName = this.tableEscaped(model);
  var cmd ="IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[" + tblName + "]') AND type in (N'U'))";
  cmd += MsSQL.newline + "BEGIN" + MsSQL.newline;
  cmd += "    DROP TABLE [dbo].[" + tblName + "]";
  cmd += MsSQL.newline + "END";
  //console.log(cmd);
  this.command(cmd, cb);
};

MsSQL.prototype.createTable = function (model, cb) {
  var tblName = this.tableEscaped(model);
  var cmd = "SET ANSI_NULLS ON;" + MsSQL.newline + "SET QUOTED_IDENTIFIER ON;" + MsSQL.newline + "SET ANSI_PADDING ON;" + MsSQL.newline;
  cmd += "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[" + tblName + "]') AND type in (N'U'))" + MsSQL.newline + "BEGIN" + MsSQL.newline;
  cmd += "CREATE TABLE [dbo].[" + this.tableEscaped(model) + "] (";
  cmd += MsSQL.newline + "    " + this.propertiesSQL(model) + MsSQL.newline;
  cmd += ") ON [PRIMARY]" + MsSQL.newline + "END;" + MsSQL.newline;
  //console.log(cmd);
  cmd += this.createIndexes(model);
  this.command(cmd, cb);
};

MsSQL.prototype.createIndexes = function(model) {
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
  if(dxs) {
    Object.keys(this._models[model].settings.indexes).forEach(function(prop){
      sql.push(self.indexSettingsSQL(model, prop));
    });
  }

  return sql.join(MsSQL.newline);
}

function datatype(p) {
    var dt = '';
    switch (p.type.name) {
        default:
        case 'String':
        case 'JSON':
        dt = '[varchar](' + (p.limit || 255) + ')';
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
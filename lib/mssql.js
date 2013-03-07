/* Module dependencies */
var mssql = require("msnodesql");
var jdb = require("jugglingdb");
var util = require("util");

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
    schema.adapter.tableNameID = true;
    callback();
  });
};

function MsSQL(client) {
  this.name = "mssql";
  this._models = {};
  this._pkids = {};
  this._fks = {};
  this.client = client;
}

util.inherits(MsSQL, jdb.BaseSQL);

MsSQL.prototype.query = function (sql, optionsOrCallback, Callback) {
  //debugger;
  var hasOptions = true;
  var options = null;
  var cb = null;
  if (typeof optionsOrCallback === "function") {
    hasOptions = false;
    cb = optionsOrCallback;
  } else {
    options = optionsOrCallback;
    cb = Callback;
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

MsSQL.prototype.define = function (descr) {
    if (!descr.settings) descr.settings = {};
    this._models[descr.model.modelName] = descr;
    this._pkids[descr.model.modelName] = descr.model.modelName + "ID";
};

MsSQL.prototype.defineProperty = function (model, prop, params) {
  this._models[model].properties[prop] = params;
};

// MsSQL.prototype.defineForeignKey = function (className, key, cb) {
//   this._fks[model] = this._fks[model] || {};
//   this._fks[model][className] = key;
//   cb(null, Number);
// };

/**
 * Must invoke callback(err, id)
 */
MsSQL.prototype.create = function (model, data, callback) {
  //debugger;
  var fieldsAndData = this.buildInsert(model, data);
  var tblName = this.tableEscaped(model);
  var sql = "INSERT INTO " + tblName +
    " (" + fieldsAndData.fields + ")" + 
    " VALUES (" + fieldsAndData.paramPlaceholders + ")" +
    " SELECT IDENT_CURRENT('" + tblName + "') AS insertId";
  
  this.query(sql, fieldsAndData.params, function (err, results) {
      callback(err, results[0].insertId);
  });
};

MsSQL.prototype.updateOrCreate = function (model, data, callback) {
  //debugger;
  var mssql = this;
  var objModel = this._models[model];
  var props = objModel.properties;
  var tblName = this.tableEscaped(model);
  var modelPKID = this._pkids[model];
  var id = 0;
  var fieldNames = [];
  var fieldValues = [];
  var fieldValuesPlaceholders = [];
  var combined = [];
  Object.keys(data).forEach(function (key) {
    if (props[key] || key === modelPKID) {
      if (key === modelPKID) {
        id = data[key];
      } else {
        fieldNames.push(key);
        fieldValues.push(mssql.toDatabase(props[key], data[key]));
        fieldValuesPlaceholders.push("(?)");
        combined.push(key + "=(?)");
      }
    }
  });
  var sql = "";
  if (id > 0) {
    sql = "UPDATE " + tblName;
    sql += " SET " + combined.join();
    sql += " WHERE " + modelPKID + " = (?)";
    sql += "SELECT " + id + " AS pkid";
    fieldValues.push(id);
  } else {
    sql = "INSERT INTO " + tblName;
    sql += " (" + fieldNames.join() + ")";
    sql += " VALUES (" + fieldValuesPlaceholders.join() + ")";
    sql += " SELECT IDENT_CURRENT('" + tblName + "') AS pkid";
  }

  this.query(sql, fieldValues, function (err, results) {
    if (!err) {
      data[modelPKID] = results[0].pkid;
      data.id = results[0].pkid;
    }
    callback(err, data);
  });
};

MsSQL.prototype.updateAttributes = function updateAttrs(model, id, data, cb) {
  data[this._pkids[model]] = id;
  this.save(model, data, cb);
};

MsSQL.prototype.exists = function (model, id, callback) {
    var objModel = this._models[model];
    var tblName = this.tableEscaped(model);
    var modelPKID = this._pkids[model];
    var sql = "SELECT COUNT(*) cnt FROM "+tblName+" WHERE "+modelPKID+" = (?)"
    //console.log(sql);
    this.query(sql, [id], function (err, results) {
        if (err) return callback(err);
        callback(null, results[0].cnt >= 1);
    });
};

MsSQL.prototype.find = function (model, id, callback) {
    //debugger;
    var objModel = this._models[model];
    var tblName = this.tableEscaped(model);
    var modelPKID = this._pkids[model];
    var sql = "SELECT * FROM "+tblName+" WHERE "+modelPKID+" = (?)";
    //console.log(sql);
    this.query(sql, [id], function (err, results) {
        //debugger;
        // if (!err)
        //   results[0].id = results[0][modelPKID];
        callback(err, this.fromDatabase(model, results[0]));
    }.bind(this));
};

MsSQL.prototype.buildInsert = function (model, data) {
  var insertIntoFields = [];
  var paramPlaceholders = [];
  var params = [];
  var props = this._models[model].properties;
  Object.keys(data).forEach(function (key) {
    if (props[key]) {
      insertIntoFields.push(this.escapeKey(key));
      paramPlaceholders.push("(?)");
      params.push(this.toDatabase(props[key], data[key]));
    }
  }.bind(this));

  return { fields:insertIntoFields.join(), paramPlaceholders:paramPlaceholders.join(), params:params };
}

function dateToMsSql(val) {
  return val.getUTCFullYear() + '-' +
    fillZeros(val.getUTCMonth() + 1) + '-' +
    fillZeros(val.getUTCDate()) + ' ' +
    fillZeros(val.getUTCHours()) + ':' +
    fillZeros(val.getUTCMinutes()) + ':' +
    fillZeros(val.getUTCSeconds());

  function fillZeros(v) {
    return v < 10 ? '0' + v : v;
  }
}

MsSQL.prototype.toDatabase = function (prop, val) {
    if (val === null) {
      return 'NULL';
    }
    if (val.constructor.name === 'Object') {
      var operator = Object.keys(val)[0]
      val = val[operator];
      if (operator === 'between') {
        return  this.toDatabase(prop, val[0]) +
                ' AND ' +
                this.toDatabase(prop, val[1]);
      } else if (operator == 'inq' || operator == 'nin') {
        if (!(val.propertyIsEnumerable('length')) && typeof val === 'object' && typeof val.length === 'number') { //if value is array
          return val.join(',');
        } else {
          return val;
        }
      }
    }
    if (!prop) {
      return val;
    }
    if (prop.type.name === 'Number') {
      return val;
    }
    if (prop.type.name === 'Date') {
        if (!val) {
          return 'NULL';
        }
        if (!val.toUTCString) {
            val = new Date(val);
        }
        return '\'' + dateToMsSql(val) + '\'';
    }
    if (prop.type.name == "Boolean") {
      return val ? 1 : 0;
    }
    return val.toString();
};

MsSQL.prototype.fromDatabase = function (model, data) {
    if (!data) {
      return null;
    }
    var props = this._models[model].properties;
    var modelPKID = this._pkids[model];
    Object.keys(data).forEach(function (key) {
        var val = data[key];
        if (key === modelPKID){
          data.id = val;
        }
        if (props[key]) {
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

MsSQL.prototype.all = function all(model, filter, callback) {

    var sql = "SELECT * FROM " + this.tableEscaped(model);
    var self = this;
    var props = this._models[model].properties;

    if (filter) {

        if (filter.where) {
            sql += " " + buildWhere(filter.where);
        }

        if (filter.order) {
            sql += " " + buildOrderBy(filter.order);
        }

    }

    this.query(sql, function (err, data) {
        if (err) {
            return callback(err, []);
        }

        data.id = data[this._pkids[model]];

        var objs = data.map(function (obj) {
            return self.fromDatabase(model, obj);
        });
        if (filter && filter.include) {
            this._models[model].model.include(objs, filter.include, callback);
        } else {
            callback(null, objs);
        }
    }.bind(this));

    return sql;

    function buildWhere(conds) {
        var cs = [];
        Object.keys(conds).forEach(function (key) {
            var keyEscaped = self.escapeKey(key);
            var val = self.toDatabase(props[key], conds[key]);
            if (conds[key] === null) {
                cs.push(keyEscaped + ' IS NULL');
            } else if (conds[key].constructor.name === 'Object') {
                var condType = Object.keys(conds[key])[0];
                var sqlCond = keyEscaped;
                if ((condType == 'inq' || condType == 'nin') && val.length == 0) {
                    cs.push(condType == 'inq' ? 0 : 1);
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
    }

    function buildOrderBy(order) {
        if (typeof order === 'string') order = [order];
        return 'ORDER BY ' + order.join(', ');
    }

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

// MsSQL.prototype.alterTable = function (model, actualFields, actualIndexes, done, checkOnly) {
//     var self = this;
//     var m = this._models[model];
//     var propNames = Object.keys(m.properties).filter(function (name) {
//         return !!m.properties[name];
//     });
//     var indexNames = m.settings.indexes ? Object.keys(m.settings.indexes).filter(function (name) {
//         return !!m.settings.indexes[name];
//     }) : [];
//     var sql = [];
//     var ai = {};

//     if (actualIndexes) {
//         actualIndexes.forEach(function (i) {
//             var name = i.Key_name;
//             if (!ai[name]) {
//                 ai[name] = {
//                     info: i,
//                     columns: []
//                 };
//             }
//             ai[name].columns[i.Seq_in_index - 1] = i.Column_name;
//         });
//     }
//     var aiNames = Object.keys(ai);

//     // change/add new fields
//     propNames.forEach(function (propName) {
//         if (propName === 'id') return;
//         var found;
//         actualFields.forEach(function (f) {
//             if (f.Field === propName) {
//                 found = f;
//             }
//         });

//         if (found) {
//             actualize(propName, found);
//         } else {
//             sql.push('ADD COLUMN `' + propName + '` ' + self.propertySettingsSQL(model, propName));
//         }
//     });

//     // drop columns
//     actualFields.forEach(function (f) {
//         var notFound = !~propNames.indexOf(f.Field);
//         if (f.Field === 'id') return;
//         if (notFound || !m.properties[f.Field]) {
//             sql.push('DROP COLUMN `' + f.Field + '`');
//         }
//     });

//     // remove indexes
//     aiNames.forEach(function (indexName) {
//         if (indexName === 'id' || indexName === 'PRIMARY') return;
//         if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] || m.properties[indexName] && !m.properties[indexName].index) {
//             sql.push('DROP INDEX `' + indexName + '`');
//         } else {
//             // first: check single (only type and kind)
//             if (m.properties[indexName] && !m.properties[indexName].index) {
//                 // TODO
//                 return;
//             }
//             // second: check multiple indexes
//             var orderMatched = true;
//             if (indexNames.indexOf(indexName) !== -1) {
//                 m.settings.indexes[indexName].columns.split(/,\s*/).forEach(function (columnName, i) {
//                     if (ai[indexName].columns[i] !== columnName) orderMatched = false;
//                 });
//             }
//             if (!orderMatched) {
//                 sql.push('DROP INDEX `' + indexName + '`');
//                 delete ai[indexName];
//             }
//         }
//     });

//     // add single-column indexes
//     propNames.forEach(function (propName) {
//         var i = m.properties[propName].index;
//         if (!i) {
//             return;
//         }
//         var found = ai[propName] && ai[propName].info;
//         if (!found) {
//             var type = '';
//             var kind = '';
//             if (i.type) {
//                 type = 'USING ' + i.type;
//             }
//             if (i.kind) {
//                 // kind = i.kind;
//             }
//             if (kind && type) {
//                 sql.push('ADD ' + kind + ' INDEX `' + propName + '` (`' + propName + '`) ' + type);
//             } else {
//                 sql.push('ADD ' + kind + ' INDEX `' + propName + '` ' + type + ' (`' + propName + '`) ');
//             }
//         }
//     });

//     // add multi-column indexes
//     indexNames.forEach(function (indexName) {
//         var i = m.settings.indexes[indexName];
//         var found = ai[indexName] && ai[indexName].info;
//         if (!found) {
//             var type = '';
//             var kind = '';
//             if (i.type) {
//                 type = 'USING ' + i.type;
//             }
//             if (i.kind) {
//                 kind = i.kind;
//             }
//             if (kind && type) {
//                 sql.push('ADD ' + kind + ' INDEX `' + indexName + '` (' + i.columns + ') ' + type);
//             } else {
//                 sql.push('ADD ' + kind + ' INDEX ' + type + ' `' + indexName + '` (' + i.columns + ')');
//             }
//         }
//     });

//     if (sql.length) {
//         var query = 'ALTER TABLE ' + self.tableEscaped(model) + ' ' + sql.join(',\n');
//         if (checkOnly) {
//             done(null, true, {statements: sql, query: query});
//         } else {
//             this.query(query, done);
//         }
//     } else {
//         done();
//     }

//     function actualize(propName, oldSettings) {
//         var newSettings = m.properties[propName];
//         if (newSettings && changed(newSettings, oldSettings)) {
//             sql.push('CHANGE COLUMN `' + propName + '` `' + propName + '` ' + self.propertySettingsSQL(model, propName));
//         }
//     }

//     function changed(newSettings, oldSettings) {
//         if (oldSettings.Null === 'YES' && (newSettings.allowNull === false || newSettings.null === false)) return true;
//         if (oldSettings.Null === 'NO' && !(newSettings.allowNull === false || newSettings.null === false)) return true;
//         if (oldSettings.Type.toUpperCase() !== datatype(newSettings)) return true;
//         return false;
//     }
// };

MsSQL.prototype.propertiesSQL = function (model) {
    debugger;
    var self = this;
    var objModel = this._models[model];
    var modelPKID = typeof objModel.primaryKey !== "undefined" && objModel.primaryKey !== null ? objModel.primaryKey : tblName + "ID";

    var sql = ["'"+modelPKID+"' INT IDENTITY PRIMARY KEY"];
    Object.keys(this._models[model].properties).forEach(function (prop) {
        if (prop === modelPKID) {
         return;
        }
        sql.push("'" + prop + "'" + self.propertySettingsSQL(model, prop));
    });
    // Declared in model index property indexes.
    Object.keys(this._models[model].properties).forEach(function (prop) {
        var i = self._models[model].properties[prop].index;
        if (i) {
            sql.push(self.singleIndexSettingsSQL(model, prop));
        }
    });
    // Settings might not have an indexes property.
    var dxs = this._models[model].settings.indexes;
    if(dxs){
        Object.keys(this._models[model].settings.indexes).forEach(function(prop){
            sql.push(self.indexSettingsSQL(model, prop));
        });
    }
    return sql.join(',\n  ');
};

MsSQL.prototype.singleIndexSettingsSQL = function (model, prop) {
    // Recycled from alterTable single indexes above, more or less.
    var i = this._models[model].properties[prop].index;
    var type = '';
    var kind = '';
    if (i.type) {
        type = 'USING ' + i.type;
    }
    if (i.kind) {
        kind = i.kind;
    }
    if (kind && type) {
        return (kind + ' INDEX `' + prop + '` (`' + prop + '`) ' + type);
    } else {
        return (kind + ' INDEX `' + prop + '` ' + type + ' (`' + prop + '`) ');
    }
};

MsSQL.prototype.indexSettingsSQL = function (model, prop) {
    // Recycled from alterTable multi-column indexes above, more or less.
    var i = this._models[model].settings.indexes[prop];
    var type = '';
    var kind = '';
    if (i.type) {
        type = 'USING ' + i.type;
    }
    if (i.kind) {
        kind = i.kind;
    }
    if (kind && type) {
        return (kind + ' INDEX `' + prop + '` (' + i.columns + ') ' + type);
    } else {
        return (kind + ' INDEX ' + type + ' `' + prop + '` (' + i.columns + ')');
    }
};

MsSQL.prototype.propertySettingsSQL = function (model, prop) {
    var p = this._models[model].properties[prop];
    return datatype(p) + ' ' +
    (p.allowNull === false || p['null'] === false ? 'NOT NULL' : 'NULL');
};

function datatype(p) {
    var dt = '';
    switch (p.type.name) {
        default:
        case 'String':
        case 'JSON':
        dt = 'VARCHAR(' + (p.limit || 255) + ')';
        break;
        case 'Text':
        dt = 'TEXT';
        break;
        case 'Number':
        dt = 'INT';
        break;
        case 'Date':
        dt = 'DATETIME';
        break;
        case 'Boolean':
        dt = 'TINYINT(1)';
        break;
        case 'Point':
        dt = 'POINT';
        break;
    }
    return dt;
}
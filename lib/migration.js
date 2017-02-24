// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var g = require('strong-globalize')();

var async = require('async');

module.exports = mixinMigration;

function mixinMigration(MsSQL) {
  MsSQL.prototype.showFields = function(model, cb) {
    var sql = 'select [COLUMN_NAME] as [Field], ' +
      ' [IS_NULLABLE] as [Null], [DATA_TYPE] as [Type],' +
      ' [CHARACTER_MAXIMUM_LENGTH] as [Length],' +
      ' [NUMERIC_PRECISION] as [Precision], NUMERIC_SCALE as [Scale]' +
      ' from INFORMATION_SCHEMA.COLUMNS' +
      ' where [TABLE_SCHEMA] = \'' + this.schema(model) + '\'' +
      ' and [TABLE_NAME] = \'' + this.table(model) + '\'' +
      ' order by [ORDINAL_POSITION]';
    this.execute(sql, function(err, fields) {
      if (err) {
        return cb && cb(err);
      } else {
        if (Array.isArray(fields)) {
          fields.forEach(function(f) {
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

  MsSQL.prototype.showIndexes = function(model, cb) {
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

     this.execute(sql, function (err, fields) {
     cb && cb(err, fields);
     });
     */

    process.nextTick(function() {
      cb && cb(null, []);
    });
  };

  MsSQL.prototype.isActual = function(cb) {
    var ok = false;
    var self = this;
    async.each(Object.keys(this._models), function(model, done) {
      self.getTableStatus(model, function(err, fields, indexes) {
        self.alterTable(model, fields, indexes, function(err, needAlter) {
          if (err) {
            return done(err);
          } else {
            ok = ok || needAlter;
            done(err);
          }
        }, true);
      });
    }, function(err) {
      if (err) {
        return err;
      }
      cb(null, !ok);
    });
  };

  MsSQL.prototype.alterTable = function(model, actualFields, actualIndexes, done, checkOnly) {
    var self = this;
    var m = this._models[model];
    var idName = this.idName(model);

    var propNames = Object.keys(m.properties).filter(function(name) {
      return !!m.properties[name];
    });
    var indexNames = m.settings.indexes ? Object.keys(m.settings.indexes).filter(function(name) {
      return !!m.settings.indexes[name];
    }) : [];
    var sql = [];
    var ai = {};

    if (actualIndexes) {
      actualIndexes.forEach(function(i) {
        var name = i.Key_name;
        if (!ai[name]) {
          ai[name] = {
            info: i,
            columns: [],
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
    propNames.forEach(function(propName) {
      if (propName === idName) return;
      var found;
      actualFields.forEach(function(f) {
        if (f.Field === propName) {
          found = f;
        }
      });

      if (found) {
        actualize(propName, found);
      } else {
        columnsToAdd.push(self.columnEscaped(model, propName) +
          ' ' + self.propertySettingsSQL(model, propName));
      }
    });

    // drop columns
    actualFields.forEach(function(f) {
      var notFound = !~propNames.indexOf(f.Field);
      if (f.Field === idName) return;
      if (notFound || !m.properties[f.Field]) {
        columnsToDrop.push(self.columnEscaped(model, f.Field));
      }
    });

    // remove indexes
    aiNames.forEach(function(indexName) {
      if (indexName === idName || indexName === 'PRIMARY') {
        return;
      }
      if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] ||
        m.properties[indexName] && !m.properties[indexName].index) {
        sql.push('DROP INDEX ' + self.columnEscaped(model, indexName));
      } else {
        // first: check single (only type and kind)
        if (m.properties[indexName] && !m.properties[indexName].index) {
          // TODO
          return;
        }
        // second: check multiple indexes
        var orderMatched = true;
        if (indexNames.indexOf(indexName) !== -1) {
          m.settings.indexes[indexName].columns.split(/,\s*/).forEach(function(columnName, i) {
            if (ai[indexName].columns[i] !== columnName) {
              orderMatched = false;
            }
          });
        }
        if (!orderMatched) {
          sql.push('DROP INDEX [' + self.columnEscaped(model, indexName) + ']');
          delete ai[indexName];
        }
      }
    });

    // add single-column indexes
    propNames.forEach(function(propName) {
      var i = m.properties[propName].index;
      if (!i) {
        return;
      }
      var found = ai[propName] && ai[propName].info;
      var columnName = self.columnEscaped(model, propName);
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
          sql.push('ADD ' + kind + ' INDEX ' + columnName +
            ' (' + columnName + ') ' + type);
        } else {
          sql.push('ADD ' + kind + ' INDEX [' + propName + '] ' +
            type + ' ([' + propName + ']) ');
        }
      }
    });

    // add multi-column indexes
    indexNames.forEach(function(indexName) {
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
          sql.push('ADD ' + kind + ' INDEX [' + indexName + '] (' +
            i.columns + ') ' + type);
        } else {
          sql.push('ADD ' + kind + ' INDEX [' + indexName + '] (' +
            i.columns + ') ');
        }
      }
    });

    var statements = [];
    if (columnsToAdd.length) {
      statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' ADD ' +
        columnsToAdd.join(',' + MsSQL.newline));
    }

    if (columnsToAlter.length) {
      // SQL Server doesn't allow multiple columns to be altered in one statement
      columnsToAlter.forEach(function(c) {
        statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' ALTER COLUMN ' +
          c);
      });
    }

    if (columnsToDrop.length) {
      statements.push('ALTER TABLE ' + self.tableEscaped(model) + ' DROP COLUMN' +
        columnsToDrop.join(',' + MsSQL.newline));
    }

    async.each(statements, function(query, fn) {
      if (checkOnly) {
        fn(null, true, {statements: statements, query: query});
      } else {
        self.execute(query, fn);
      }
    }, function(err, results) {
      done && done(err, results);
    });

    function actualize(propName, oldSettings) {
      var newSettings = m.properties[propName];
      if (newSettings && changed(newSettings, oldSettings)) {
        columnsToAlter.push(self.columnEscaped(model, propName) + ' ' +
          self.propertySettingsSQL(model, propName));
      }
    }

    function changed(newSettings, oldSettings) {
      if (oldSettings.Null === 'YES' &&
        (newSettings.allowNull === false || newSettings.null === false)) {
        return true;
      }
      if (oldSettings.Null === 'NO' && !(newSettings.allowNull === false ||
        newSettings.null === false)) {
        return true;
      }
      if (oldSettings.Type.toUpperCase() !== datatype(newSettings)) {
        return true;
      }
      return false;
    }
  };

  MsSQL.prototype.propertiesSQL = function(model) {
    // debugger;
    var self = this;
    var objModel = this._models[model];
    var modelPKID = this.idName(model);

    var sql = [];
    var props = Object.keys(objModel.properties);
    for (var i = 0, n = props.length; i < n; i++) {
      var prop = props[i];
      if (prop === modelPKID) {
        var idProp = objModel.properties[modelPKID];
        if (idProp.type === Number) {
          if (idProp.generated !== false) {
            sql.push(self.columnEscaped(model, modelPKID) +
              ' ' + self.columnDataType(model, modelPKID) + ' IDENTITY(1,1) NOT NULL');
          } else {
            sql.push(self.columnEscaped(model, modelPKID) +
              ' ' + self.columnDataType(model, modelPKID) + ' NOT NULL');
          }
          continue;
        } else if (idProp.type === String) {
          if (idProp.generated !== false) {
            sql.push(self.columnEscaped(model, modelPKID) +
              ' [uniqueidentifier] DEFAULT newid() NOT NULL');
          } else {
            sql.push(self.columnEscaped(model, modelPKID) + ' ' +
              self.propertySettingsSQL(model, prop) + ' DEFAULT newid()');
          }
          continue;
        }
      }
      sql.push(self.columnEscaped(model, prop) + ' ' + self.propertySettingsSQL(model, prop));
    }
    var joinedSql = sql.join(',' + MsSQL.newline + '    ');
    var cmd = '';
    if (modelPKID) {
      cmd = 'PRIMARY KEY CLUSTERED' + MsSQL.newline + '(' + MsSQL.newline;
      cmd += ' ' + self.columnEscaped(model, modelPKID) + ' ASC' + MsSQL.newline;
      cmd += ') WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, ' +
      'IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON)';
    }

    joinedSql += ',' + MsSQL.newline + cmd;

    return joinedSql;
  };

  MsSQL.prototype.singleIndexSettingsSQL = function(model, prop, add) {
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
    var name = prop + '_' + kind + '_' + type + '_idx';
    if (i.name) {
      name = i.name;
    }
    this._idxNames[model].push(name);
    var cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
      tblName + MsSQL.newline;
    cmd += '(' + MsSQL.newline;
    cmd += '    [' + prop + '] ' + type;
    cmd += MsSQL.newline + ') WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF,' +
      ' SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ' +
      'ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);' +
      MsSQL.newline;
    return cmd;
  };

  MsSQL.prototype.indexSettingsSQL = function(model, prop) {
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
    var splitcolumns = i.columns.split(',');
    var columns = [];
    var name = '';
    splitcolumns.forEach(function(elem, ind) {
      var trimmed = elem.trim();
      name += trimmed + '_';
      trimmed = '[' + trimmed + '] ' + type;
      columns.push(trimmed);
    });

    name += kind + '_' + type + '_idx';
    this._idxNames[model].push(name);

    var cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
      tblName + MsSQL.newline;
    cmd += '(' + MsSQL.newline;
    cmd += columns.join(',' + MsSQL.newline);
    cmd += MsSQL.newline + ') WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF, ' +
      'SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ' +
      'ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);' +
      MsSQL.newline;
    return cmd;
  };

  function isNullable(p) {
    return !(p.required || p.id || p.nullable === false ||
    p.allowNull === false || p['null'] === false);
  }

  MsSQL.prototype.propertySettingsSQL = function(model, prop) {
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
          done(new Error(g.f('Model not found: %s', model)));
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

  MsSQL.prototype.dropTable = function(model, cb) {
    var tblName = this.tableEscaped(model);
    var cmd = "IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'" +
      tblName + "') AND type in (N'U'))";
    cmd += MsSQL.newline + 'BEGIN' + MsSQL.newline;
    cmd += '    DROP TABLE ' + tblName;
    cmd += MsSQL.newline + 'END';
    this.execute(cmd, cb);
  };

  MsSQL.prototype.createTable = function(model, cb) {
    var tblName = this.tableEscaped(model);
    var cmd = 'SET ANSI_NULLS ON;' + MsSQL.newline + 'SET QUOTED_IDENTIFIER ON;' +
      MsSQL.newline + 'SET ANSI_PADDING ON;' + MsSQL.newline;
    cmd += "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'" +
      tblName + "') AND type in (N'U'))" + MsSQL.newline + 'BEGIN' + MsSQL.newline;
    cmd += 'CREATE TABLE ' + this.tableEscaped(model) + ' (';
    cmd += MsSQL.newline + '    ' + this.propertiesSQL(model) + MsSQL.newline;
    cmd += ')' + MsSQL.newline + 'END;' + MsSQL.newline;
    cmd += this.createIndexes(model);
    this.execute(cmd, cb);
  };

  MsSQL.prototype.createIndexes = function(model) {
    var self = this;
    var sql = [];
    // Declared in model index property indexes.
    Object.keys(this._models[model].properties).forEach(function(prop) {
      var i = self._models[model].properties[prop].index;
      if (i) {
        sql.push(self.singleIndexSettingsSQL(model, prop));
      }
    });

    // Settings might not have an indexes property.
    var dxs = this._models[model].settings.indexes;
    if (dxs) {
      Object.keys(this._models[model].settings.indexes).forEach(function(prop) {
        sql.push(self.indexSettingsSQL(model, prop));
      });
    }

    return sql.join(MsSQL.newline);
  };

  MsSQL.prototype.columnDataType = function(model, property) {
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
      var dataPrecision = columnMetadata.dataPrecision;
      var dataScale = columnMetadata.dataScale;
      if (dataPrecision && dataScale) {
        return colType + '(' + dataPrecision + ', ' + dataScale + ')';
      }
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
}

// Copyright IBM Corp. 2015,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('strong-globalize')();

const async = require('async');

module.exports = mixinMigration;

function mixinMigration(MsSQL) {
  MsSQL.prototype.showFields = function(model, cb) {
    const sql = 'select [COLUMN_NAME] as [Field], ' +
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
    const schema = "'" + this.schema(model) + "'";
    const table = "'" + this.table(model) + "'";
    const sql = 'SELECT OBJECT_SCHEMA_NAME(T.[object_id],DB_ID()) AS [table_schema],' +
    ' T.[name] AS [Table], I.[name] AS [Key_name], AC.[name] AS [Column_name],' +
    ' I.[type_desc], I.[is_unique], I.[data_space_id], I.[ignore_dup_key], I.[is_primary_key],' +
    ' I.[is_unique_constraint], I.[fill_factor], I.[is_padded], I.[is_disabled], I.[is_hypothetical],' +
    ' I.[allow_row_locks], I.[allow_page_locks], IC.[is_descending_key], IC.[is_included_column]' +
    ' FROM sys.[tables] AS T' +
    ' INNER JOIN sys.[indexes] I ON T.[object_id] = I.[object_id]' +
    ' INNER JOIN sys.[index_columns] IC ON I.[object_id] = IC.[object_id]' +
    ' INNER JOIN sys.[all_columns] AC ON T.[object_id] = AC.[object_id] AND IC.[column_id] = AC.[column_id]' +
    ' WHERE T.[is_ms_shipped] = 0 AND I.[type_desc] <> \'HEAP\'' +
    ' AND OBJECT_SCHEMA_NAME(T.[object_id],DB_ID()) = ' + schema + ' AND T.[name] = ' + table +
    ' ORDER BY T.[name], I.[index_id], IC.[key_ordinal]';

    this.execute(sql, function(err, fields) {
      cb && cb(err, fields);
    });
  };

  MsSQL.prototype.isActual = function(models, cb) {
    let ok = false;
    const self = this;

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

  MsSQL.prototype.getColumnsToAdd = function(model, actualFields) {
    const self = this;
    const m = self._models[model];
    const propNames = Object.keys(m.properties).filter(function(name) {
      return !!m.properties[name];
    });
    const idName = this.idName(model);

    const statements = [];
    const columnsToAdd = [];
    const columnsToAlter = [];

    // change/add new fields
    propNames.forEach(function(propName) {
      if (propName === idName) return;
      let found;
      if (actualFields) {
        actualFields.forEach(function(f) {
          if (f.Field === propName) {
            found = f;
          }
        });
      }

      if (found) {
        actualize(propName, found);
      } else {
        columnsToAdd.push(self.columnEscaped(model, propName) +
          ' ' + self.propertySettingsSQL(model, propName));
      }
    });

    if (columnsToAdd.length) {
      statements.push('ADD ' + columnsToAdd.join(',' + MsSQL.newline));
    }

    if (columnsToAlter.length) {
      // SQL Server doesn't allow multiple columns to be altered in one statement
      columnsToAlter.forEach(function(c) {
        statements.push('ALTER COLUMN ' + c);
      });
    }

    function actualize(propName, oldSettings) {
      const newSettings = m.properties[propName];
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
    return statements;
  };

  MsSQL.prototype.getColumnsToDrop = function(model, actualFields) {
    const self = this;
    const m = this._models[model];
    const propNames = Object.keys(m.properties).filter(function(name) {
      return !!m.properties[name];
    });
    const idName = this.idName(model);

    const statements = [];
    const columnsToDrop = [];

    if (actualFields) {
      // drop columns
      actualFields.forEach(function(f) {
        const notFound = !~propNames.indexOf(f.Field);
        if (f.Field === idName) return;
        if (notFound || !m.properties[f.Field]) {
          columnsToDrop.push(self.columnEscaped(model, f.Field));
        }
      });

      if (columnsToDrop.length) {
        statements.push('DROP COLUMN' + columnsToDrop.join(',' + MsSQL.newline));
      }
    }
    return statements;
  };

  MsSQL.prototype.addIndexes = function(model, actualIndexes) {
    const self = this;
    const m = this._models[model];
    const idName = this.idName(model);

    const indexNames = m.settings.indexes ? Object.keys(m.settings.indexes).filter(function(name) {
      return !!m.settings.indexes[name];
    }) : [];
    const propNames = Object.keys(m.properties).filter(function(name) {
      return !!m.properties[name];
    });

    const ai = {};
    const sql = [];

    if (actualIndexes) {
      actualIndexes.forEach(function(i) {
        const name = i.Key_name;
        if (!ai[name]) {
          ai[name] = {
            info: i,
            columns: [],
          };
        }
        ai[name].columns[i.Seq_in_index - 1] = i.Column_name;
      });
    }

    const aiNames = Object.keys(ai);

    // remove indexes
    aiNames.forEach(function(indexName) {
      if (indexName.substr(0, 3) === 'PK_') {
        return;
      }
      if (indexNames.indexOf(indexName) === -1 && !m.properties[indexName] ||
        m.properties[indexName] && !m.properties[indexName].index) {
        sql.push('DROP INDEX ' + indexName + ' ON ' + self.tableEscaped(model));
      } else {
        // first: check single (only type and kind)
        if (m.properties[indexName] && !m.properties[indexName].index) {
          // TODO
          return;
        }
        // second: check multiple indexes
        let orderMatched = true;
        if (indexNames.indexOf(indexName) !== -1) {
          m.settings.indexes[indexName].columns.split(/,\s*/).forEach(function(columnName, i) {
            if (ai[indexName].columns[i] !== columnName) {
              orderMatched = false;
            }
          });
        }
        if (!orderMatched) {
          sql.push('DROP INDEX ' + self.columnEscaped(model, indexName) + ' ON ' + self.tableEscaped(model));
          delete ai[indexName];
        }
      }
    });

    // add single-column indexes
    propNames.forEach(function(propName) {
      const found = ai[propName] && ai[propName].info;
      if (!found) {
        const tblName = self.tableEscaped(model);
        const i = m.properties[propName].index;
        if (!i) {
          return;
        }
        let type = 'ASC';
        let kind = 'NONCLUSTERED';
        let unique = false;
        if (i.type) {
          type = i.type;
        }
        if (i.kind) {
          kind = i.kind;
        }
        if (i.unique) {
          unique = true;
        }
        let name = propName + '_' + kind + '_' + type + '_idx';
        if (i.name) {
          name = i.name;
        }
        self._idxNames[model].push(name);
        let cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
          tblName + MsSQL.newline;
        cmd += '(' + MsSQL.newline;
        cmd += '    [' + propName + '] ' + type;
        cmd += MsSQL.newline + ') WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF,' +
          ' SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ' +
          'ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);' +
          MsSQL.newline;
        sql.push(cmd);
      }
    });

    // add multi-column indexes
    indexNames.forEach(function(indexName) {
      const found = ai[indexName] && ai[indexName].info;
      if (!found) {
        const tblName = self.tableEscaped(model);
        const i = m.settings.indexes[indexName];
        let type = 'ASC';
        let kind = 'NONCLUSTERED';
        let unique = false;
        if (i.type) {
          type = i.type;
        }
        if (i.kind) {
          kind = i.kind;
        }
        if (i.unique) {
          unique = true;
        }
        const splitcolumns = i.columns.split(',');
        const columns = [];
        let name = '';

        splitcolumns.forEach(function(elem, ind) {
          let trimmed = elem.trim();
          name += trimmed + '_';
          trimmed = '[' + trimmed + '] ' + type;
          columns.push(trimmed);
        });

        name += kind + '_' + type + '_idx';
        self._idxNames[model].push(name);

        let cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
          tblName + MsSQL.newline;
        cmd += '(' + MsSQL.newline;
        cmd += columns.join(',' + MsSQL.newline);
        cmd += MsSQL.newline + ') WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE = OFF, ' +
          'SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ' +
          'ONLINE = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON);' +
          MsSQL.newline;
        sql.push(cmd);
      }
    });
    return sql;
  };

  MsSQL.prototype.alterTable = function(model, actualFields, actualIndexes, done, checkOnly) {
    const self = this;

    let statements = self.getAddModifyColumns(model, actualFields);
    statements = statements.concat(self.getDropColumns(model, actualFields));
    statements = statements.concat(self.addIndexes(model, actualIndexes));

    async.each(statements, function(query, fn) {
      if (checkOnly) {
        fn(null, true, {statements: statements, query: query});
      } else {
        self.applySqlChanges(model, [query], fn);
      }
    }, function(err, results) {
      done && done(err, results);
    });
  };

  MsSQL.prototype.propertiesSQL = function(model) {
    // debugger;
    const self = this;
    const objModel = this._models[model];
    const modelPKID = this.idName(model);

    const sql = [];
    const props = Object.keys(objModel.properties);
    for (let i = 0, n = props.length; i < n; i++) {
      const prop = props[i];
      if (prop === modelPKID) {
        const idProp = objModel.properties[modelPKID];
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
    let joinedSql = sql.join(',' + MsSQL.newline + '    ');
    let cmd = '';
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
    const tblName = this.tableEscaped(model);
    const i = this._models[model].properties[prop].index;
    let type = 'ASC';
    let kind = 'NONCLUSTERED';
    let unique = false;
    if (i.type) {
      type = i.type;
    }
    if (i.kind) {
      kind = i.kind;
    }
    if (i.unique) {
      unique = true;
    }
    let name = prop + '_' + kind + '_' + type + '_idx';
    if (i.name) {
      name = i.name;
    }
    this._idxNames[model].push(name);
    let cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
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
    const tblName = this.tableEscaped(model);
    const i = this._models[model].settings.indexes[prop];
    let type = 'ASC';
    let kind = 'NONCLUSTERED';
    let unique = false;
    if (i.type) {
      type = i.type;
    }
    if (i.kind) {
      kind = i.kind;
    }
    if (i.unique) {
      unique = true;
    }
    const splitcolumns = i.columns.split(',');
    const columns = [];
    let name = '';
    splitcolumns.forEach(function(elem, ind) {
      let trimmed = elem.trim();
      name += trimmed + '_';
      trimmed = '[' + trimmed + '] ' + type;
      columns.push(trimmed);
    });

    name += kind + '_' + type + '_idx';
    this._idxNames[model].push(name);

    let cmd = 'CREATE ' + (unique ? 'UNIQUE ' : '') + kind + ' INDEX [' + name + '] ON ' +
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
    const p = this._models[model].properties[prop];
    return this.columnDataType(model, prop) + ' ' +
      (isNullable(p) ? 'NULL' : 'NOT NULL');
  };

  MsSQL.prototype.automigrate = function(models, cb) {
    const self = this;
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
    const tblName = this.tableEscaped(model);
    let cmd = "IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'" +
      tblName + "') AND type in (N'U'))";
    cmd += MsSQL.newline + 'BEGIN' + MsSQL.newline;
    cmd += '    DROP TABLE ' + tblName;
    cmd += MsSQL.newline + 'END';
    this.execute(cmd, cb);
  };

  MsSQL.prototype.createTable = function(model, cb) {
    const tblName = this.tableEscaped(model);
    let cmd = 'SET ANSI_NULLS ON;' + MsSQL.newline + 'SET QUOTED_IDENTIFIER ON;' +
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
    const self = this;
    const sql = [];
    // Declared in model index property indexes.
    Object.keys(this._models[model].properties).forEach(function(prop) {
      const i = self._models[model].properties[prop].index;
      if (i) {
        sql.push(self.singleIndexSettingsSQL(model, prop));
      }
    });

    // Settings might not have an indexes property.
    const dxs = this._models[model].settings.indexes;
    if (dxs) {
      Object.keys(this._models[model].settings.indexes).forEach(function(prop) {
        sql.push(self.indexSettingsSQL(model, prop));
      });
    }

    return sql.join(MsSQL.newline);
  };

  MsSQL.prototype.columnDataType = function(model, property) {
    const columnMetadata = this.columnMetadata(model, property);
    let colType = columnMetadata && columnMetadata.dataType;
    if (colType) {
      colType = colType.toUpperCase();
    }
    const prop = this._models[model].properties[property];
    if (!prop) {
      return null;
    }
    const colLength = columnMetadata && columnMetadata.dataLength || prop.length;
    if (colType) {
      const dataPrecision = columnMetadata.dataPrecision;
      const dataScale = columnMetadata.dataScale;
      if (dataPrecision && dataScale) {
        return colType + '(' + dataPrecision + ', ' + dataScale + ')';
      }
      return colType + (colLength ? '(' + colLength + ')' : '');
    }
    return datatype(prop);
  };

  function datatype(p) {
    let dt = '';
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

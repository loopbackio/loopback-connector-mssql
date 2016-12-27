// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var g = require('strong-globalize')();

module.exports = mixinDiscovery;

function mixinDiscovery(MsSQL) {
  var async = require('async');

  function paginateSQL2012(sql, orderBy, options) {
    options = options || {};
    var offset = options.offset || options.skip;
    if (isNaN(offset)) {
      offset = 0;
    }
    var limit = options.limit;
    if (isNaN(limit)) {
      limit = -1;
    }
    if (offset === 0 && limit === -1) {
      return sql;
    }

    var fetch = '';
    if (options.offset || options.skip || options.limit) {
      fetch = ' OFFSET ' + offset + ' ROWS'; // Offset starts from 0
      if (options.limit) {
        fetch = fetch + ' FETCH NEXT ' + options.limit + 'ROWS ONLY';
      }
      if (!orderBy) {
        sql += ' ORDER BY 1';
      }
    }
    if (orderBy) {
      sql += ' ORDER BY ' + orderBy;
    }
    return sql + fetch;
  }

  function paginateSQL(sql, orderBy, options) {
    options = options || {};
    var offset = options.offset || options.skip;
    if (isNaN(offset)) {
      offset = 0;
    }
    var limit = options.limit;
    if (isNaN(limit)) {
      limit = -1;
    }
    if (offset === 0 && limit === -1) {
      return sql;
    }
    var index = sql.indexOf(' FROM');
    var select = sql.substring(0, index);
    var from = sql.substring(index);
    if (orderBy) {
      orderBy = 'ORDER BY ' + orderBy;
    } else {
      orderBy = 'ORDER BY 1';
    }
    var paginatedSQL = 'SELECT *' + MsSQL.newline +
      'FROM (' + MsSQL.newline +
      select + ', ROW_NUMBER() OVER' +
      ' (' + orderBy + ') AS rowNum' + MsSQL.newline +
      from + MsSQL.newline;
    paginatedSQL += ') AS S' + MsSQL.newline +
      'WHERE S.rowNum > ' + offset;

    if (limit !== -1) {
      paginatedSQL += ' AND S.rowNum <= ' + (offset + limit);
    }

    return paginatedSQL + MsSQL.newline;
  }

  /*!
   * Build sql for listing tables
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  function queryTables(options) {
    var sqlTables = null;
    var owner = options.owner || options.schema;

    if (options.all && !owner) {
      sqlTables = paginateSQL('SELECT \'table\' AS "type", table_name AS "name", table_schema AS "owner"' +
        ' FROM information_schema.tables', 'table_schema, table_name', options);
    } else if (owner) {
      sqlTables = paginateSQL('SELECT \'table\' AS "type", table_name AS "name", table_schema AS "owner"' +
        ' FROM information_schema.tables WHERE table_schema=\'' + owner + '\'', 'table_schema, table_name', options);
    } else {
      sqlTables = paginateSQL('SELECT \'table\' AS "type", table_name AS "name",' +
        ' table_schema AS "owner" FROM information_schema.tables WHERE table_schema=schema_name()',
        'table_name', options);
    }
    return sqlTables;
  }

  /*!
   * Build sql for listing views
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  function queryViews(options) {
    var sqlViews = null;
    if (options.views) {
      var owner = options.owner || options.schema;

      if (options.all && !owner) {
        sqlViews = paginateSQL('SELECT \'view\' AS "type", table_name AS "name",' +
          ' table_schema AS "owner" FROM information_schema.views',
          'table_schema, table_name', options);
      } else if (owner) {
        sqlViews = paginateSQL('SELECT \'view\' AS "type", table_name AS "name",' +
            ' table_schema AS "owner" FROM information_schema.views WHERE table_schema=\'' + owner + '\'',
          'table_schema, table_name', options);
      } else {
        sqlViews = paginateSQL('SELECT \'view\' AS "type", table_name AS "name",' +
          ' schema_name() AS "owner" FROM information_schema.views',
          'table_name', options);
      }
    }
    return sqlViews;
  }

  /**
   * Discover model definitions
   *
   * @param {Object} options Options for discovery
   * @param {Function} [cb] The callback function
   */
  MsSQL.prototype.discoverModelDefinitions = function(options, cb) {
    if (!cb && typeof options === 'function') {
      cb = options;
      options = {};
    }
    options = options || {};

    var self = this;
    var calls = [function(callback) {
      self.execute(queryTables(options), callback);
    }];

    if (options.views) {
      calls.push(function(callback) {
        self.execute(queryViews(options), callback);
      });
    }
    async.parallel(calls, function(err, data) {
      if (err) {
        cb(err, data);
      } else {
        var merged = [];
        merged = merged.concat(data.shift());
        if (data.length) {
          merged = merged.concat(data.shift());
        }
        cb(err, merged);
      }
    });
  };

  /*!
   * Normalize the arguments
   * @param table string, required
   * @param options object, optional
   * @param cb function, optional
   */
  function getArgs(table, options, cb) {
    if ('string' !== typeof table || !table) {
      throw new Error(g.f('{{table}} is a required string argument: %s', table));
    }
    options = options || {};
    if (!cb && 'function' === typeof options) {
      cb = options;
      options = {};
    }
    if (typeof options !== 'object') {
      throw new Error(g.f('{{options}} must be an {{object}}: %s', options));
    }
    return {
      owner: options.owner || options.schema,
      table: table,
      options: options,
      cb: cb,
    };
  }

  /*!
   * Build the sql statement to query columns for a given table
   * @param owner
   * @param table
   * @returns {String} The sql statement
   */
  function queryColumns(owner, table) {
    var sql = null;
    if (owner) {
      sql = paginateSQL('SELECT table_schema AS "owner", table_name AS "tableName", column_name' +
          ' AS "columnName", data_type AS "dataType",' +
          ' character_maximum_length AS "dataLength", numeric_precision AS' +
          ' "dataPrecision", numeric_scale AS "dataScale", is_nullable AS "nullable"' +
          ' FROM information_schema.columns' +
          ' WHERE table_schema=\'' + owner + '\'' +
          (table ? ' AND table_name=\'' + table + '\'' : ''),
        'table_schema, table_name, ordinal_position', {});
    } else {
      sql = paginateSQL('SELECT schema_name() AS "owner", table_name' +
          ' AS "tableName", column_name AS "columnName", data_type AS "dataType",' +
          ' character_maximum_length AS "dataLength", numeric_precision AS "dataPrecision", numeric_scale AS' +
          ' "dataScale", is_nullable AS "nullable"' +
          ' FROM information_schema.columns' +
          (table ? ' WHERE table_name=\'' + table + '\'' : ''),
        'table_name, ordinal_position', {});
    }
    return sql;
  }

  /**
   * Discover model properties from a table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   *
   */
  MsSQL.prototype.discoverModelProperties = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var owner = args.owner;
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryColumns(owner, table);
    var callback = function(err, results) {
      if (err) {
        cb(err, results);
      } else {
        results.map(function(r) {
          r.type = mysqlDataTypeToJSONType(r.dataType, r.dataLength);
        });
        cb(err, results);
      }
    };
    this.execute(sql, callback);
  };

  /*!
   * Build the sql statement for querying primary keys of a given table
   * @param owner
   * @param table
   * @returns {string}
   */
// http://docs.oracle.com/javase/6/docs/api/java/sql/DatabaseMetaData.html#getPrimaryKeys(java.lang.String, java.lang.String, java.lang.String)

  /*
   select tc.table_schema, tc.table_name, kc.column_name
   from
   information_schema.table_constraints tc
   join information_schema.key_column_usage kc
   on kc.table_name = tc.table_name and kc.table_schema = tc.table_schema
   where
   tc.constraint_type = 'PRIMARY KEY'
   and kc.ordinal_position is not null
   order by tc.table_schema,
   tc.table_name,
   kc.ordinal_position;
   */

  function queryForPrimaryKeys(owner, table) {
    var sql = 'SELECT kc.table_schema AS "owner", ' +
      'kc.table_name AS "tableName", kc.column_name AS "columnName", kc.ordinal_position' +
      ' AS "keySeq", kc.constraint_name AS "pkName" FROM' +
      ' information_schema.key_column_usage kc' +
      ' JOIN information_schema.table_constraints tc' +
      ' ON kc.table_name = tc.table_name AND kc.table_schema = tc.table_schema AND kc.constraint_name = tc.constraint_name' +
      ' WHERE tc.constraint_type=\'PRIMARY KEY\' AND kc.ordinal_position IS NOT NULL';

    if (owner) {
      sql += ' AND kc.table_schema=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND kc.table_name=\'' + table + '\'';
    }
    sql += ' ORDER BY kc.table_schema, kc.table_name, kc.ordinal_position';
    return sql;
  }

  /**
   * Discover primary keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MsSQL.prototype.discoverPrimaryKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var owner = args.owner;
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryForPrimaryKeys(owner, table);
    this.execute(sql, cb);
  };

  /*!
   * Build the sql statement for querying foreign keys of a given table
   * @param owner
   * @param table
   * @returns {string}
   */
  /*
   SELECT
   tc.constraint_name, tc.table_name, kcu.column_name,
   ccu.table_name AS foreign_table_name,
   ccu.column_name AS foreign_column_name
   FROM
   information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
   ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
   ON ccu.constraint_name = tc.constraint_name
   WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='mytable';
SELECT tc.table_schema AS "fkOwner", tc.constraint_name AS "fkName", OBJECT_NAME (f.referenced_object_id) AS "fkTableName", 
kcu.column_name AS "fkColumnName", kcu.ordinal_position AS "keySeq", ccu.table_schema AS "pkOwner", 'PK' AS "pkName",  ccu.table_name AS "pkTableName", ccu.column_name AS "pkColumnName" 
FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage AS kcu 
ON tc.constraint_schema = kcu.constraint_schema AND tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage ccu 
ON ccu.constraint_schema = tc.constraint_schema AND ccu.constraint_name = tc.constraint_name
JOIN sys.foreign_keys AS f
ON f.name =  tc.constraint_name
JOIN sys.foreign_key_columns AS fc   
ON f.object_id = fc.constraint_object_id

WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='PR_Publication'
   */
  function queryForeignKeys(owner, table) {
    var sql =
      'SELECT tc.table_schema AS "fkOwner", tc.constraint_name AS "fkName", OBJECT_NAME (f.referenced_object_id) AS "fkTableName",' +
      ' kcu.column_name AS "fkColumnName", kcu.ordinal_position AS "keySeq",' +
      ' ccu.table_schema AS "pkOwner", \'PK\' AS "pkName", ' +
      ' ccu.table_name AS "pkTableName", ccu.column_name AS "pkColumnName"' +
      ' FROM information_schema.table_constraints tc' +
      ' JOIN information_schema.key_column_usage AS kcu' +
      ' ON tc.constraint_schema = kcu.constraint_schema AND tc.constraint_name = kcu.constraint_name' +
      ' JOIN information_schema.constraint_column_usage ccu' +
      ' ON ccu.constraint_schema = tc.constraint_schema AND ccu.constraint_name = tc.constraint_name' +
      ' JOIN sys.foreign_keys AS f' +
      ' ON f.name =  tc.constraint_name' +
      ' JOIN sys.foreign_key_columns AS fc' +  
      ' ON f.object_id = fc.constraint_object_id' +
      ' WHERE tc.constraint_type = \'FOREIGN KEY\'';
    if (owner) {
      sql += ' AND tc.table_schema=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND tc.table_name=\'' + table + '\'';
    }
    return sql;
  }

  /**
   * Discover foreign keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MsSQL.prototype.discoverForeignKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var owner = args.owner;
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryForeignKeys(owner, table);
    this.execute(sql, cb);
  };

  /*!
   * Retrieves a description of the foreign key columns that reference the given table's primary key columns (the foreign keys exported by a table).
   * They are ordered by fkTableOwner, fkTableName, and keySeq.
   * @param owner
   * @param table
   * @returns {string}
   */
  function queryExportedForeignKeys(owner, table) {
    var sql = 'SELECT kcu.constraint_name AS "fkName", kcu.table_schema AS "fkOwner", kcu.table_name AS "fkTableName",' +
      ' kcu.column_name AS "fkColumnName", kcu.ordinal_position AS "keySeq",' +
      ' \'PK\' AS "pkName", ccu.table_schema AS "pkOwner",' +
      ' ccu.table_name AS "pkTableName", ccu.column_name AS "pkColumnName"' +
      ' FROM' +
      ' information_schema.constraint_column_usage ccu' +
      ' JOIN information_schema.key_column_usage kcu' +
      ' ON ccu.constraint_schema = kcu.constraint_schema AND ccu.constraint_name = kcu.constraint_name' +
      ' WHERE kcu.ordinal_position IS NOT NULL';
    if (owner) {
      sql += ' and ccu.table_schema=\'' + owner + '\'';
    }
    if (table) {
      sql += ' and ccu.table_name=\'' + table + '\'';
    }
    sql += ' order by kcu.table_schema, kcu.table_name, kcu.ordinal_position';

    return sql;
  }

  /**
   * Discover foreign keys that reference to the primary key of this table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  MsSQL.prototype.discoverExportedForeignKeys = function(table, options, cb) {
    var args = getArgs(table, options, cb);
    var owner = args.owner;
    table = args.table;
    options = args.options;
    cb = args.cb;

    var sql = queryExportedForeignKeys(owner, table);
    this.execute(sql, cb);
  };

  function mysqlDataTypeToJSONType(mysqlType, dataLength) {
    var type = mysqlType.toUpperCase();
    switch (type) {
      case 'BIT':
        return 'Boolean';

      case 'CHAR':
      case 'VARCHAR':
      case 'TEXT':

      case 'NCHAR':
      case 'NVARCHAR':
      case 'NTEXT':

      case 'CHARACTER VARYING':
      case 'CHARACTER':
        return 'String';

      case 'BINARY':
      case 'VARBINARY':
      case 'IMAGE':
        return 'Binary';

      case 'BIGINT':
      case 'NUMERIC':
      case 'SMALLINT':
      case 'DECIMAL':
      case 'SMALLMONEY':
      case 'INT':
      case 'TINYINT':
      case 'MONEY':
      case 'FLOAT':
      case 'REAL':
        return 'Number';

      case 'DATE':
      case 'DATETIMEOFFSET':
      case 'DATETIME2':
      case 'SMALLDATETIME':
      case 'DATETIME':
      case 'TIME':
        return 'Date';

      case 'POINT':
        return 'GeoPoint';
      default:
        return 'String';
    }
  }
}

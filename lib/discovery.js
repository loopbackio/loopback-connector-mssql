// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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

  MsSQL.prototype.paginateSQL = function(sql, orderBy, options) {
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
  };

  /*!
   * Build sql for listing tables
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  MsSQL.prototype.buildQueryTables = function(options) {
    var sqlTables = null;
    var owner = options.owner || options.schema;

    if (options.all && !owner) {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", TABLE_NAME AS "name", TABLE_SCHEMA AS "owner"' +
        ' FROM INFORMATION_SCHEMA.TABLES', 'TABLE_SCHEMA, TABLE_NAME', options);
    } else if (owner) {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", TABLE_NAME AS "name", TABLE_SCHEMA AS "owner"' +
        ' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=\'' + owner + '\'', 'TABLE_SCHEMA, TABLE_NAME', options);
    } else {
      sqlTables = this.paginateSQL('SELECT \'table\' AS "type", TABLE_NAME AS "name",' +
        ' TABLE_SCHEMA AS "owner" FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=schema_name()',
      'TABLE_NAME', options);
    }
    return sqlTables;
  };

  /*!
   * Build sql for listing views
   * @param options {all: for all owners, owner: for a given owner}
   * @returns {string} The sql statement
   */
  MsSQL.prototype.buildQueryViews = function(options) {
    var sqlViews = null;
    if (options.views) {
      var owner = options.owner || options.schema;

      if (options.all && !owner) {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", TABLE_NAME AS "name",' +
          ' TABLE_SCHEMA AS "owner" FROM INFORMATION_SCHEMA.VIEWS',
        'TABLE_SCHEMA, TABLE_NAME', options);
      } else if (owner) {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", TABLE_NAME AS "name",' +
            ' TABLE_SCHEMA AS "owner" FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA=\'' + owner + '\'',
        'TABLE_SCHEMA, TABLE_NAME', options);
      } else {
        sqlViews = this.paginateSQL('SELECT \'view\' AS "type", TABLE_NAME AS "name",' +
          ' schema_name() AS "owner" FROM INFORMATION_SCHEMA.VIEWS',
        'TABLE_NAME', options);
      }
    }
    return sqlViews;
  };

  /**
   * Discover model definitions
   *
   * @param {Object} options Options for discovery
   * @param {Function} [cb] The callback function
   */

  /*!
   * Normalize the arguments
   * @param table string, required
   * @param options object, optional
   * @param cb function, optional
   */
  MsSQL.prototype.getArgs = function(table, options, cb) {
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
      schema: options.owner || options.schema,
      owner: options.owner || options.schema,
      table: table,
      options: options,
      cb: cb,
    };
  };

  /*!
   * Build the sql statement to query columns for a given table
   * @param owner
   * @param table
   * @returns {String} The sql statement
   */
  MsSQL.prototype.buildQueryColumns = function(owner, table) {
    var sql = null;
    if (owner) {
      sql = this.paginateSQL('SELECT TABLE_SCHEMA AS "owner", TABLE_NAME AS "tableName", COLUMN_NAME' +
          ' AS "columnName", DATA_TYPE AS "dataType",' +
          ' CHARACTER_MAXIMUM_LENGTH AS "dataLength", NUMERIC_PRECISION AS' +
          ' "dataPrecision", NUMERIC_SCALE AS "dataScale", IS_NULLABLE AS "nullable"' +
          ' ,COLUMNPROPERTY(object_id(TABLE_SCHEMA+\'.\'+TABLE_NAME), COLUMN_NAME, \'IsIdentity\') AS "generated"' +
          ' FROM INFORMATION_SCHEMA.COLUMNS' +
          ' WHERE TABLE_SCHEMA=\'' + owner + '\'' +
          (table ? ' AND TABLE_NAME=\'' + table + '\'' : ''),
      'TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION', {});
    } else {
      sql = this.paginateSQL('SELECT schema_name() AS "owner", TABLE_NAME' +
          ' AS "tableName", COLUMN_NAME AS "columnName", DATA_TYPE AS "dataType",' +
          ' CHARACTER_MAXIMUM_LENGTH AS "dataLength", NUMERIC_PRECISION AS "dataPrecision", NUMERIC_SCALE AS' +
          ' "dataScale", IS_NULLABLE AS "nullable"' +
          ' ,COLUMNPROPERTY(object_id(schema_name()+\'.\'+TABLE_NAME), COLUMN_NAME, \'IsIdentity\') AS "generated"' +
          ' FROM INFORMATION_SCHEMA.COLUMNS' +
          (table ? ' WHERE TABLE_NAME=\'' + table + '\'' : ''),
      'TABLE_NAME, ORDINAL_POSITION', {});
    }
    return sql;
  };

  /**
   * Discover model properties from a table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   *
   */

  /*!
   * Build the sql statement for querying primary keys of a given table
   * @param owner
   * @param table
   * @returns {string}
   */
  // http://docs.oracle.com/javase/6/docs/api/java/sql/DatabaseMetaData.html#getPrimaryKeys(java.lang.String, java.lang.String, java.lang.String)

  /*
   select tc.TABLE_SCHEMA, tc.TABLE_NAME, kc.COLUMN_NAME
   from
   INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
   join INFORMATION_SCHEMA.KEY_COLUMN_USAGE kc
   on kc.TABLE_NAME = tc.TABLE_NAME and kc.TABLE_SCHEMA = tc.TABLE_SCHEMA
   where
   tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
   and kc.ORDINAL_POSITION is not null
   order by tc.TABLE_SCHEMA,
   tc.TABLE_NAME,
   kc.ORDINAL_POSITION;
   */

  MsSQL.prototype.buildQueryPrimaryKeys = function(owner, table) {
    var sql = 'SELECT kc.TABLE_SCHEMA AS "owner", ' +
      'kc.TABLE_NAME AS "tableName", kc.COLUMN_NAME AS "columnName", kc.ORDINAL_POSITION' +
      ' AS "keySeq", kc.CONSTRAINT_NAME AS "pkName" FROM' +
      ' INFORMATION_SCHEMA.KEY_COLUMN_USAGE kc' +
      ' JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc' +
      ' ON kc.TABLE_NAME = tc.TABLE_NAME AND kc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kc.TABLE_SCHEMA = tc.TABLE_SCHEMA' +
      ' WHERE tc.CONSTRAINT_TYPE=\'PRIMARY KEY\' AND kc.ORDINAL_POSITION IS NOT NULL';

    if (owner) {
      sql += ' AND kc.TABLE_SCHEMA=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND kc.TABLE_NAME=\'' + table + '\'';
    }
    sql += ' ORDER BY kc.TABLE_SCHEMA, kc.TABLE_NAME, kc.ORDINAL_POSITION';
    return sql;
  };

  /**
   * Discover primary keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */
  // MsSQL.prototype.discoverPrimaryKeys = function(table, options, cb) {
  //   var args = this.getArgs(table, options, cb);
  //   var owner = args.owner;
  //   table = args.table;
  //   options = args.options;
  //   cb = args.cb;
  //
  //   var sql = this.queryPrimaryKeys(owner, table);
  //   this.execute(sql, cb);
  // };

  /*!
   * Build the sql statement for querying foreign keys of a given table
   * @param owner
   * @param table
   * @returns {string}
   */
  /*
   SELECT
   tc.CONSTRAINT_NAME, tc.TABLE_NAME, kcu.COLUMN_NAME,
   ccu.TABLE_NAME AS foreign_table_name,
   ccu.COLUMN_NAME AS foreign_column_name
   FROM
   INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
   JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
   ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
   JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ccu
   ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
   WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' AND tc.TABLE_NAME='mytable';

   */
  MsSQL.prototype.buildQueryForeignKeys = function(owner, table) {
    var sql =
      'SELECT tc.TABLE_SCHEMA AS "fkOwner", tc.CONSTRAINT_NAME AS "fkName", tc.TABLE_NAME AS "fkTableName",' +
      ' kcu.COLUMN_NAME AS "fkColumnName", kcu.ORDINAL_POSITION AS "keySeq",' +
      ' ccu.TABLE_SCHEMA AS "pkOwner", \'PK\' AS "pkName", ' +
      ' ccu.TABLE_NAME AS "pkTableName", ccu.COLUMN_NAME AS "pkColumnName"' +
      ' FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc' +
      ' JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu' +
      ' ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME' +
      ' JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu' +
      ' ON ccu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME' +
      ' WHERE tc.CONSTRAINT_TYPE = \'FOREIGN KEY\'';
    if (owner) {
      sql += ' AND tc.TABLE_SCHEMA=\'' + owner + '\'';
    }
    if (table) {
      sql += ' AND tc.TABLE_NAME=\'' + table + '\'';
    }
    return sql;
  };

  /**
   * Discover foreign keys for a given table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
   */

  /*!
   * Retrieves a description of the foreign key columns that reference the given table's primary key columns (the foreign keys exported by a table).
   * They are ordered by fkTableOwner, fkTableName, and keySeq.
   * @param owner
   * @param table
   * @returns {string}
   */
  MsSQL.prototype.buildQueryExportedForeignKeys = function(owner, table) {
    var sql = 'SELECT kcu.CONSTRAINT_NAME AS "fkName", kcu.TABLE_SCHEMA AS "fkOwner", kcu.TABLE_NAME AS "fkTableName",' +
      ' kcu.COLUMN_NAME AS "fkColumnName", kcu.ORDINAL_POSITION AS "keySeq",' +
      ' \'PK\' AS "pkName", ccu.TABLE_SCHEMA AS "pkOwner",' +
      ' ccu.TABLE_NAME AS "pkTableName", ccu.COLUMN_NAME AS "pkColumnName"' +
      ' FROM' +
      ' INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu' +
      ' JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu' +
      ' ON ccu.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND ccu.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME' +
      ' WHERE kcu.ORDINAL_POSITION IS NOT NULL';
    if (owner) {
      sql += ' and ccu.TABLE_SCHEMA=\'' + owner + '\'';
    }
    if (table) {
      sql += ' and ccu.TABLE_NAME=\'' + table + '\'';
    }
    sql += ' order by kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.ORDINAL_POSITION';

    return sql;
  };

  /**
   * Discover foreign keys that reference to the primary key of this table
   * @param {String} table The table name
   * @param {Object} options The options for discovery
   * @param {Function} [cb] The callback function
  //  */

  MsSQL.prototype.buildPropertyType = function(columnDefinition, options) {
    var mysqlType = columnDefinition.dataType;
    var dataLength = options.dataLength || columnDefinition.dataLength;
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
  };

  MsSQL.prototype.setDefaultOptions = function(options) {
  };

  MsSQL.prototype.setNullableProperty = function(property) {
  };

  MsSQL.prototype.getDefaultSchema = function() {
    return '';
  };
}

// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var assert = require('assert');
var ds;

before(function() {
  /* global getDataSource */
  ds = getDataSource();
});

describe('MS SQL server connector', function() {
  it('should auto migrate/update tables', function(done) {
    this.timeout(30000);

    /* eslint-disable camelcase */
    var schema_v1 =
      {
        name: 'CustomerTest',
        options: {
          idInjection: false,
          mssql: {
            schema: 'dbo',
            table: 'CUSTOMER_TEST',
          },
          indexes: {
            idEmailIndex: {
              keys: {
                id: 1,
                email: 1,
              },
              options: {
                unique: true,
              },
              columns: 'id,email',
              kind: 'unique',
            },
          },
        },
        properties: {
          id: {
            type: 'String',
            length: 20,
            id: 1,
          },
          name: {
            type: 'String',
            required: false,
            length: 40,
          },
          email: {
            type: 'String',
            required: true,
            length: 40,
          },
          age: {
            type: 'Number',
            required: false,
          },
          firstName: {
            type: 'String',
            required: false,
          },
        },
      };

    var schema_v2 =
      {
        name: 'CustomerTest',
        options: {
          idInjection: false,
          mssql: {
            schema: 'dbo',
            table: 'CUSTOMER_TEST',
          },
          indexes: {
            idCityIndex: {
              keys: {
                id: 1,
                city: 1,
              },
              options: {
                unique: true,
              },
              columns: 'id,city',
              kind: 'unique',
            },
          },
        },
        properties: {
          id: {
            type: 'String',
            length: 20,
            id: 1,
          },
          email: {
            type: 'String',
            required: false,
            length: 60,
            mssql: {
              columnName: 'EMAIL',
              dataType: 'nvarchar',
              dataLength: 60,
              nullable: 'YES',
            },
          },
          firstName: {
            type: 'String',
            required: false,
            length: 40,
          },
          lastName: {
            type: 'String',
            required: false,
            length: 40,
          },
          city: {
            type: 'String',
            required: false,
            length: 40,
            index: {
              unique: true,
            },
          },
        },
      };

    ds.createModel(schema_v1.name, schema_v1.properties, schema_v1.options);
    /* eslint-enable camelcase */

    ds.automigrate(function(err) {
      assert(!err);
      ds.discoverModelProperties('CUSTOMER_TEST', function(err, props) {
        assert(!err);
        assert.equal(props.length, 5);
        var names = props.map(function(p) {
          return p.columnName;
        });
        assert.equal(props[0].nullable, 'NO');
        assert.equal(props[1].nullable, 'YES');
        assert.equal(props[2].nullable, 'NO');
        assert.equal(props[3].nullable, 'YES');

        assert.equal(names[0], 'id');
        assert.equal(names[1], 'name');
        assert.equal(names[2], 'email');
        assert.equal(names[3], 'age');
        /* eslint-disable camelcase */
        ds.createModel(schema_v2.name, schema_v2.properties, schema_v2.options);
        /* eslint-enable camelcase */
        ds.autoupdate(function(err, result) {
          ds.discoverModelProperties('CUSTOMER_TEST', function(err, props) {
            assert.equal(props.length, 5);
            var names = props.map(function(p) {
              return p.columnName;
            });
            assert.equal(names[0], 'id');
            assert.equal(names[1], 'email');
            assert.equal(names[2], 'firstName');
            assert.equal(names[3], 'lastName');
            assert.equal(names[4], 'city');

            var schema = "'dbo'";
            var table = "'CUSTOMER_TEST'";
            var sql = 'SELECT OBJECT_SCHEMA_NAME(T.[object_id],DB_ID()) AS [table_schema],' +
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

            ds.connector.execute(sql, function(err, indexes) {
              var countIdEmailIndex = 0;
              var countIdCityIndex = 0;
              var countCityIndex = 0;
              var countAgeIndex = 0;
              for (var i = 0; i < indexes.length; i++) {
                if (indexes[i].Key_name == 'id_email_unique_ASC_idx') {
                  countIdEmailIndex++;
                }
                if (indexes[i].Key_name == 'id_city_unique_ASC_idx') {
                  countIdCityIndex++;
                }
                if (indexes[i].Key_name == 'city_NONCLUSTERED_ASC_idx') {
                  countCityIndex++;
                }
                if (indexes[i].Key_name == 'age_NONCLUSTERED_ASC_idx') {
                  countAgeIndex++;
                }
              }
              assert.equal(countIdEmailIndex, 0);
              assert.equal(countAgeIndex, 0);
              assert.equal(countIdCityIndex > 0, true);
              assert.equal(countCityIndex > 0, true);
              done(err, result);
            });
          });
        });
      });
    });
  });

  it('should report errors for automigrate', function() {
    ds.automigrate('XYZ', function(err) {
      assert(err);
    });
  });

  it('should report errors for autoupdate', function() {
    ds.autoupdate('XYZ', function(err) {
      assert(err);
    });
  });
});

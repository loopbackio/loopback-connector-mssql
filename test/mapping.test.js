// Copyright IBM Corp. 2015,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var should = require('should');
require('./init');

var async = require('async');

var db;

before(function() {
  /* global getDataSource */
  db = getDataSource();
});

describe('Mapping models', function() {
  it('should honor the mssql settings for table/column', function(done) {
    var schema = {
      name: 'TestInventory',
      options: {
        idInjection: false,
        mssql: {
          schema: 'dbo', table: 'INVENTORYTEST',
        },
      },
      properties: {
        productId: {
          type: 'Number',
          id: true,
          generated: true,
          mssql: {
            columnName: 'PRODUCT_ID',
            nullable: 'N',
          },
        },
        locationId: {
          type: 'String',
          required: true,
          length: 20,
          mssql: {
            columnName: 'LOCATION_ID',
            dataType: 'nvarchar',
            nullable: 'N',
          },
        },
        available: {
          type: 'Number',
          required: false,
          mssql: {
            columnName: 'AVAILABLE',
            dataType: 'int',
            nullable: 'Y',
          },
        },
        total: {
          type: 'Number',
          required: false,
          mssql: {
            columnName: 'TOTAL',
            dataType: 'int',
            nullable: 'Y',
          },
        },
      },
    };
    var models = db.modelBuilder.buildModels(schema);
    var Model = models.TestInventory;
    Model.attachTo(db);

    db.automigrate(function(err, data) {
      async.series([
        function(callback) {
          Model.destroyAll(callback);
        },
        function(callback) {
          Model.create({locationId: 'l001', available: 10, total: 50},
            callback);
        },
        function(callback) {
          Model.create({locationId: 'l002', available: 30, total: 40},
            callback);
        },
        function(callback) {
          Model.create({locationId: 'l001', available: 15, total: 30},
            callback);
        },
        function(callback) {
          Model.find({fields: ['productId', 'locationId', 'available']},
            function(err, results) {
              // console.log(results);
              results.should.have.lengthOf(3);
              results.forEach(function(r) {
                r.should.have.property('productId');
                r.should.have.property('locationId');
                r.should.have.property('available');
                should.equal(r.total, undefined);
              });
              callback(null, results);
            });
        },
        function(callback) {
          Model.find({fields: {'total': false}}, function(err, results) {
            // console.log(results);
            results.should.have.lengthOf(3);
            results.forEach(function(r) {
              r.should.have.property('productId');
              r.should.have.property('locationId');
              r.should.have.property('available');
              should.equal(r.total, undefined);
            });
            callback(null, results);
          });
        },
      ], done);
    });
  });
});

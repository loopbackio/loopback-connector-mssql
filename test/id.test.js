// Copyright IBM Corp. 2015,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init.js');
var should = require('should');
var assert = require('assert');
var async = require('async');
var ds;

before(function() {
  /* global getDataSource */
  ds = getDataSource();
});

describe('Manipulating id column', function() {
  it('should auto generate id', function(done) {
    var schema =
      {
        name: 'WarehouseTest',
        options: {
          mssql: {
            schema: 'dbo',
            table: 'WAREHOUSE_TEST',
          },
        },
        properties: {
          id: {
            type: 'Number',
            id: true,
          },
          name: {
            type: 'String',
            required: false,
            length: 40,
          },
        },
      };

    var models = ds.modelBuilder.buildModels(schema);
    var Model = models.WarehouseTest;
    Model.attachTo(ds);

    ds.automigrate(function(err) {
      assert(!err);
      async.series([
        function(callback) {
          Model.destroyAll(callback);
        },
        function(callback) {
          Model.create({name: 'w1'},
            callback);
        },
        function(callback) {
          Model.create({name: 'w2'},
            callback);
        },
        function(callback) {
          Model.create({name: 'w3'},
            callback);
        },
        function(callback) {
          Model.find({order: 'id asc'},
            function(err, results) {
              assert(!err);
              results.should.have.lengthOf(3);
              for (var i = 0; i < results.length; i++) {
                should.equal(results[i].id, i + 1);
              }
              callback();
            });
        },
      ], done);
    });
  });

  it('should use manual id', function(done) {
    var schema =
      {
        name: 'WarehouseTest',
        options: {
          idInjection: false,
          mssql: {
            schema: 'dbo',
            table: 'WAREHOUSE_TEST',
          },
        },
        properties: {
          id: {
            type: 'Number',
            id: true,
            generated: false,
          },
          name: {
            type: 'String',
            required: false,
            length: 40,
          },
        },
      };

    var models = ds.modelBuilder.buildModels(schema);
    var Model = models.WarehouseTest;
    Model.attachTo(ds);

    ds.automigrate(function(err) {
      assert(!err);
      async.series([
        function(callback) {
          Model.destroyAll(callback);
        },
        function(callback) {
          Model.create({id: 501, name: 'w1'},
            callback);
        },
        function(callback) {
          Model.find({order: 'id asc'},
            function(err, results) {
              assert(!err);
              results.should.have.lengthOf(1);
              should.equal(results[0].id, 501);
              callback();
            });
        },
      ], done);
    });
  });

  it('should use bigint id', function(done) {
    var schema =
      {
        name: 'WarehouseTest',
        options: {
          idInjection: false,
          mssql: {
            schema: 'dbo',
            table: 'WAREHOUSE_TEST',
          },
        },
        properties: {
          id: {
            type: 'Number',
            id: true,
            generated: false,
            mssql: {
              dataType: 'bigint',
              dataPrecision: 20,
              dataScale: 0,
            },
          },
          name: {
            type: 'String',
            required: false,
            length: 40,
          },
        },
      };

    var models = ds.modelBuilder.buildModels(schema);
    var Model = models.WarehouseTest;
    Model.attachTo(ds);

    ds.automigrate(function(err) {
      assert(!err);
      async.series([
        function(callback) {
          Model.destroyAll(callback);
        },
        function(callback) {
          Model.create({id: 962744456683738, name: 'w1'},
            callback);
        },
        function(callback) {
          Model.find({order: 'id asc'},
            function(err, results) {
              assert(!err);
              results.should.have.lengthOf(1);
              should.equal(results[0].id, 962744456683738);
              callback();
            });
        },
      ], done);
    });
  });
});

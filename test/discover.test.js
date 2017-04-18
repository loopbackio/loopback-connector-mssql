// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
process.env.NODE_ENV = 'test';
require('./init.js');
require('should');

var assert = require('assert');

var db = getDataSource();

describe('discoverModels', function() {
  describe('Discover database schemas', function() {
    it('should return an array of db schemas', function(done) {
      db.connector.discoverDatabaseSchemas(function(err, schemas) {
        if (err) return done(err);
        schemas.should.be.an.array;
        schemas.length.should.be.above(0);
        done();
      });
    });
  });

  describe('Discover models including views', function() {
    it('should return an array of tables and views', function(done) {
      db.discoverModelDefinitions({
        views: true,
        limit: 3,
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
            // console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          assert(views, 'Should have views');
          done(null, models);
        }
      });
    });
  });

  describe('Discover models excluding views', function() {
    it('should return an array of only tables', function(done) {
      db.discoverModelDefinitions({
        views: false,
        limit: 3,
      }, function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          var views = false;
          models.forEach(function(m) {
            // console.dir(m);
            if (m.type === 'view') {
              views = true;
            }
          });
          models.should.have.length(3);
          assert(!views, 'Should not have views');
          done(null, models);
        }
      });
    });
  });
});

describe('Discover models including other users', function() {
  it('should return an array of all tables and views', function(done) {
    db.discoverModelDefinitions({
      all: true,
      limit: 100,
    }, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        var others = false;
        models.forEach(function(m) {
          // console.dir(m);
          if (m.owner !== 'dbo') {
            others = true;
          }
        });
        assert(others, 'Should have tables/views owned by others');
        done(err, models);
      }
    });
  });
});

describe('Discover model properties', function() {
  describe('Discover a named model', function() {
    it('should return an array of columns for product', function(done) {
      db.discoverModelProperties('product', function(err, models) {
        if (err) {
          console.error(err);
          done(err);
        } else {
          models.forEach(function(m) {
            // console.dir(m);
            assert(m.tableName === 'product');
          });
          done(null, models);
        }
      });
    });
  });
});

describe('Discover model primary keys', function() {
  it('should return an array of primary keys for product', function(done) {
    db.discoverPrimaryKeys('product', function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.tableName === 'product');
        });
        done(null, models);
      }
    });
  });

  it('should return an array of primary keys for dbo.product', function(done) {
    db.discoverPrimaryKeys('product', {owner: 'dbo'}, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.tableName === 'product');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover model foreign keys', function() {
  it('should return an array of foreign keys for inventory', function(done) {
    db.discoverForeignKeys('inventory', function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.fkTableName === 'inventory');
        });
        done(null, models);
      }
    });
  });
  it('should return an array of foreign keys for dbo.inventory', function(done) {
    db.discoverForeignKeys('inventory', {owner: 'dbo'}, function(err, models) {
      if (err) {
        console.error(err);
        done(err);
      } else {
        models.forEach(function(m) {
          // console.dir(m);
          assert(m.fkTableName === 'inventory');
        });
        done(null, models);
      }
    });
  });
});

describe('Discover adl schema from a table', function() {
  it('should return an adl schema for inventory', function(done) {
    db.discoverSchema('inventory', {owner: 'dbo'}, function(err, schema) {
      // console.log('%j', schema);
      assert(schema.name === 'Inventory');
      assert(schema.options.mssql.schema === 'dbo');
      assert(schema.options.mssql.table === 'inventory');
      assert(schema.properties.productId);
      assert(schema.properties.productId.type === 'String');
      assert(schema.properties.productId.mssql.columnName === 'product_id');
      assert(schema.properties.locationId);
      assert(schema.properties.locationId.type === 'String');
      assert(schema.properties.locationId.mssql.columnName === 'location_id');
      assert(schema.properties.available);
      assert(schema.properties.available.type === 'Number');
      assert(schema.properties.total);
      assert(schema.properties.total.type === 'Number');
      done(null, schema);
    });
  });
});

// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = {};
try {
  config = require('rc')('loopback', {test: {mssql: {}}}).test.mssql;
} catch (err) {
  config = {
    user: 'demo',
    password: 'L00pBack',
    host: 'localhost',
    database: 'demo',
    supportsOffSetFetch: Math.random() > 0.5,
  };
}

if (process.env.APPVEYOR) {
  config = {
    host: 'localhost',
    port: 1433,
    database: 'master',
    user: 'sa',
    password: 'Password12!',
  };
}

global.getConfig = function(options) {
  var dbConf = {
    host: config.host || config.hostname || config.server || 'localhost',
    port: config.port || 1433,
    database: config.database || 'test',
    user: config.user || config.username,
    password: config.password,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  if (options) {
    for (var el in options) {
      dbConf[el] = options[el];
    }
  }

  return dbConf;
};

global.getDataSource = global.getSchema = function(options) {
  var db = new DataSource(require('../'), getConfig(options));
  return db;
};

global.connectorCapabilities = {
  ilike: false,
  nilike: false,
};

global.sinon = require('sinon');

// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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

global.getConfig = function(options) {
  var dbConf = {
    host: process.env.MSSQL_HOST || config.host || config.hostname || config.server || 'localhost',
    port: process.env.MSSQL_PORT || config.port || 1433,
    database: process.env.MSSQL_DATABASE || config.database || 'test',
    user: process.env.MSSQL_USER || config.user || config.username,
    password: process.env.MSSQL_PASSWORD || config.password,
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
  /* global getConfig */
  var db = new DataSource(require('../'), getConfig(options));
  return db;
};

global.connectorCapabilities = {
  ilike: false,
  nilike: false,
};

global.sinon = require('sinon');

module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;

var config = {};
try {
  config = require('rc')('loopback', { test: { mssql: {}}}).test.mssql;
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

global.sinon = require('sinon');

/* eslint-env node, mocha */
require('./init.js');
var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var url = require('url');
var mssqlConnector = require('../');

var config;

before(function() {
  config = global.getConfig();
  console.log('config', config);
});

describe('testConnection', function() {
  it('should pass with valid settings', function(done) {
    var db = new DataSource(mssqlConnector, config);
    db.ping(done);
  });

  it('ignores all other settings when url is present', function(done) {
    var formatedUrl = generateURL(config);
    var dbConfig = {
      url: formatedUrl,
      host: 'invalid-hostname',
      port: 80,
      database: 'invalid-database',
      username: 'invalid-username',
      password: 'invalid-password',
    };

    var db = new DataSource(mssqlConnector, dbConfig);
    db.ping(done);
  });
});

function generateURL(config) {
  var urlObj = {
    protocol: 'mssql',
    auth:config.user + ':' + config.password,
    hostname:config.host,
    port: config.port,
    pathname: config.database,
    query: { encrypt: true },
    slashes: true,
  };
  var formatedUrl = url.format(urlObj);
  return formatedUrl;
}

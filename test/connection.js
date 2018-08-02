// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* eslint-env node, mocha */
'use strict';
require('./init.js');
var assert = require('assert');
var DataSource = require('loopback-datasource-juggler').DataSource;
var url = require('url');
var mssqlConnector = require('../');

var config;

before(function() {
  config = global.getConfig();
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
    auth: config.user + ':' + config.password,
    hostname: config.host,
    port: config.port,
    pathname: config.database,
    query: {encrypt: true},
    slashes: true,
  };
  var formatedUrl = url.format(urlObj);
  return formatedUrl;
};

describe('lazyConnect', function() {
  var getDS = function(myconfig) {
    var db = new DataSource(mssqlConnector, myconfig);
    return db;
  };

  it('should skip connect phase (lazyConnect = true)', function(done) {
    var dsConfig = {
      host: 'invalid-hostname',
      port: 80,
      lazyConnect: true,
    };
    var ds = getDS(dsConfig);

    var errTimeout = setTimeout(function() {
      done();
    }, 2000);
    ds.on('error', function(err) {
      clearTimeout(errTimeout);
      done(err);
    });
  });

  it('should report connection error (lazyConnect = false)', function(done) {
    var dsConfig = {
      host: 'invalid-hostname',
      port: 80,
      lazyConnect: false,
    };
    var ds = getDS(dsConfig);

    ds.on('error', function(err) {
      err.message.should.containEql('ENOTFOUND');
      done();
    });
  });
});

// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* eslint-env node, mocha */
'use strict';
require('./init.js');
const assert = require('assert');
const DataSource = require('loopback-datasource-juggler').DataSource;
const url = require('url');
const mssqlConnector = require('../');

let config;

before(function() {
  config = global.getConfig();
});

describe('testConnection', function() {
  it('should pass with valid settings', function(done) {
    const db = new DataSource(mssqlConnector, config);
    db.ping(done);
  });

  it('ignores all other settings when url is present', function(done) {
    const formatedUrl = generateURL(config);
    const dbConfig = {
      url: formatedUrl,
      host: 'invalid-hostname',
      port: 80,
      database: 'invalid-database',
      username: 'invalid-username',
      password: 'invalid-password',
    };

    const db = new DataSource(mssqlConnector, dbConfig);
    db.ping(done);
  });
});

function generateURL(config) {
  const urlObj = {
    protocol: 'mssql',
    auth: config.user + ':' + config.password,
    hostname: config.host,
    port: config.port,
    pathname: config.database,
    query: {encrypt: true},
    slashes: true,
  };
  const formatedUrl = url.format(urlObj);
  return formatedUrl;
}

describe('lazyConnect', function() {
  const getDS = function(myconfig) {
    const db = new DataSource(mssqlConnector, myconfig);
    return db;
  };

  it('should skip connect phase (lazyConnect = true)', function(done) {
    const dsConfig = {
      host: 'invalid-hostname',
      port: 80,
      lazyConnect: true,
    };
    const ds = getDS(dsConfig);

    const errTimeout = setTimeout(function() {
      done();
    }, 2000);
    ds.on('error', function(err) {
      clearTimeout(errTimeout);
      done(err);
    });
  });

  it('should report connection error (lazyConnect = false)', function(done) {
    const dsConfig = {
      host: 'invalid-hostname',
      port: 80,
      lazyConnect: false,
    };
    const ds = getDS(dsConfig);

    ds.on('error', function(err) {
      err.message.should.containEql('ENOTFOUND');
      done();
    });
  });
});

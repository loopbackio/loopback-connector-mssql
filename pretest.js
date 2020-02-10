// Copyright IBM Corp. 2017,2020. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

require('./test/init');
const exec = require('child_process').exec;
const path = require('path');

const isWin = (process.platform === 'win32');
const sqlFileDir = path.resolve(__dirname, 'test', 'tables.sql');
const sqlDependencyDir = path.resolve(__dirname, 'node_modules', '.bin', 'sqlcmd');

if (!process.env.CI) {
  return console.log('not seeding DB with test db');
}

if (!process.env.MSSQL_HOST) process.env.MSSQL_HOST = global.getConfig().host;
if (!process.env.MSSQL_PORT) process.env.MSSQL_PORT = global.getConfig().port;
if (!process.env.MSSQL_USER) process.env.MSSQL_USER = global.getConfig().user;
if (!process.env.MSSQL_PASSWORD) process.env.MSSQL_PASSWORD = global.getConfig().password;
if (!process.env.MSSQL_DATABASE) process.env.MSSQL_DATABASE = global.getConfig().database;

const catFileCmd = (isWin ? 'type ' : 'cat ') + sqlFileDir;

const sqlcmd = `${catFileCmd} | ${sqlDependencyDir} -s ${process.env.MSSQL_HOST} -o ${process.env.MSSQL_PORT} ` +
  `-u "${process.env.MSSQL_USER}" -p "${process.env.MSSQL_PASSWORD}" -d "${process.env.MSSQL_DATABASE}"`;

exec(sqlcmd, function(err, result) {
  if (err) return console.log('Database seeding failed.\n%s', err);
  return console.log('Database successfully seeded.');
});

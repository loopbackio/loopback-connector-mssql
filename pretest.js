'use strict';

var exec = require('child_process').exec;
var path = require('path');
var init = require(path.resolve(__dirname, 'test', 'init'));

var isWin = (process.platform === 'win32');
var sqlFileDir = path.resolve(__dirname, 'test', 'tables.sql');
var sqlDependencyDir = path.resolve(__dirname, 'node_modules', 'sqlcmdjs', 'sqlcmd.js');

// since appveyor seeds its database on the fly, we do not need to seed the share the database
if (process.env.APPVEYOR) return console.log('Not seeding DB with test db');

if (!process.env.MSSQL_HOST) process.env.MSSQL_HOST = getConfig().host;
if (!process.env.MSSQL_PORT) process.env.MSSQL_PORT = getConfig().port;
if (!process.env.MSSQL_USER) process.env.MSSQL_USER = getConfig().user;
if (!process.env.MSSQL_PASSWORD) process.env.MSSQL_PASSWORD = getConfig().password;
if (!process.env.MSSQL_DATABASE) process.env.MSSQL_DATABASE = getConfig().database;

var catFileCmd = 'cat ' + sqlFileDir;
if (isWin) catFileCmd = 'type ' + sqlFileDir;

var sqlcmd = catFileCmd + ' | ' + sqlDependencyDir + ' -s ' + process.env.MSSQL_HOST + ' -o ' + process.env.MSSQL_PORT +
' -u ' + process.env.MSSQL_USER + ' -p ' + process.env.MSSQL_PASSWORD + ' -d ' + process.env.MSSQL_DATABASE;

exec(sqlcmd, function(err, result) {
  if (err) return console.log('Database seeding failed.\n%s', err);
  else console.log('Database successfully seeded.');
});

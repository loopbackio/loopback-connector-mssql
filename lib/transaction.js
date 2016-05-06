// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var debug = require('debug')('loopback:connector:mssql:transaction');

module.exports = mixinTransaction;

/*!
 * @param {MsSQL} MsSQL connector class
 */
function mixinTransaction(MsSQL, mssql) {
  /**
   * Begin a new transaction
   * @param isolationLevel
   * @param cb
   */
  MsSQL.prototype.beginTransaction = function(isolationLevel, cb) {
    debug('Begin a transaction with isolation level: %s', isolationLevel);
    isolationLevel = mssql.ISOLATION_LEVEL[isolationLevel.replace(' ', '_')];
    var transaction = new mssql.Transaction(this.client);
    transaction.begin(isolationLevel, function(err) {
      cb(err, transaction);
    });
  };

  /**
   *
   * @param connection
   * @param cb
   */
  MsSQL.prototype.commit = function(connection, cb) {
    debug('Commit a transaction');
    connection.commit(cb);
  };

  /**
   *
   * @param connection
   * @param cb
   */
  MsSQL.prototype.rollback = function(connection, cb) {
    debug('Rollback a transaction');
    connection.rollback(cb);
  };
}

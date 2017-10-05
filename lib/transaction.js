// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
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
      if (!err) {
        // We define a queue method on the transaction instance which accepts
        // callbacks of the form:
        //   function(next) {...}
        // These will be called sequentially and must in turn call the given next
        // function.
        var last;
        transaction.queue = function(queueCB) {
          var current = {};
          var next = function() {
            if (current.then) {
              current.then.cb();
            } else {
              last = null;
            }
          };
          current.cb = function() {
            queueCB(next);
          };
          if (last) {
            last = last.then = current;
          } else {
            last = current;
            current.cb();
          }
        };
      }
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

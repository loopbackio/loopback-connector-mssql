// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
require('./init.js');
require('should');
var async = require('async');

var Transaction = require('loopback-connector').Transaction;

var db, Post;

describe('transactions', function() {
  before(function(done) {
    /* global getDataSource */
    db = getDataSource();
    Post = db.define('PostTX', {
      title: {type: String, length: 255, index: true},
      content: {type: String},
    });
    db.automigrate('PostTX', done);
  });

  // Return an async function to insert a post.
  function createInsertPost(post, tx) {
    return function(done) {
      Post.create(post, {transaction: tx},
        function(err, p) {
          if (err) {
            done(err);
          } else {
            done();
          }
        });
      };
  }

  var currentTx;
  // Return an async function to start a transaction and create a post
  function createPostInTx(post) {
    return function(done) {
      Transaction.begin(db.connector, Transaction.READ_COMMITTED,
        function(err, tx) {
          if (err) return done(err);
          currentTx = tx;
          createInsertPost(post, tx)(done);
        });
    };
  }

  // Return an async function to start a transaction and create two posts in parallel
  function createParallelPostsInTx(post1, post2) {
    return function(done) {
      Transaction.begin(db.connector, Transaction.READ_COMMITTED,
        function(err, tx) {
          if (err) return done(err);
          currentTx = tx;
          async.parallel([
            createInsertPost(post1, tx),
            createInsertPost(post2, tx),
          ], function(err, data) {
            done(err);
          });
        });
    };
  }

  // Return an async function to find matching posts and assert number of
  // records to equal to the count
  function expectToFindPosts(where, count, inTx) {
    return function(done) {
      var options = {};
      if (inTx) {
        options.transaction = currentTx;
      }
      Post.find({where: where}, options,
        function(err, posts) {
          if (err) return done(err);
          posts.length.should.be.eql(count);
          done();
        });
    };
  }

  describe('commit', function() {
    var post = {title: 't1', content: 'c1'};
    before(createPostInTx(post));

    // FIXME: [rfeng] SQL server creates LCK_M_S (Shared Lock on the table
    // and it prevents the following test to run as the SELECT will be suspended
    // until the transaction releases the lock
    it.skip('should not see the uncommitted insert', expectToFindPosts(post, 0));

    it('should see the uncommitted insert from the same transaction',
      expectToFindPosts(post, 1, true));

    it('should commit a transaction', function(done) {
      currentTx.commit(done);
    });

    it('should see the committed insert', expectToFindPosts(post, 1));
  });

  describe('rollback', function() {
    var post = {title: 't2', content: 'c2'};
    before(createPostInTx(post));

    // FIXME: [rfeng] SQL server creates LCK_M_S (Shared Lock on the table
    // and it prevents the following test to run as the SELECT will be suspended
    // until the transaction releases the lock
    it.skip('should not see the uncommitted insert', expectToFindPosts(post, 0));

    it('should see the uncommitted insert from the same transaction',
      expectToFindPosts(post, 1, true));

    it('should rollback a transaction', function(done) {
      currentTx.rollback(done);
    });

    it('should not see the rolledback insert', expectToFindPosts(post, 0));
  });

  describe('commit parallel', function() {
    var post1 = {title: 't3', content: 'c3'};
    var post2 = {title: 't4', content: 'c4'};
    before(createParallelPostsInTx(post1, post2));

    it('should see the uncommitted post1 insert from the same transaction',
      expectToFindPosts(post1, 1, true));

    it('should see the uncommitted post2 insert from the same transaction',
      expectToFindPosts(post2, 1, true));

    it('should commit a transaction', function(done) {
      currentTx.commit(done);
    });

    it('should see the committed post1 insert', expectToFindPosts(post1, 1));

    it('should see the committed post2 insert', expectToFindPosts(post2, 1));
  });

  describe('rollback parallel', function() {
    var post1 = {title: 't5', content: 'c5'};
    var post2 = {title: 't6', content: 'c6'};
    before(createParallelPostsInTx(post1, post2));

    it('should see the uncommitted post1 insert from the same transaction',
      expectToFindPosts(post1, 1, true));

    it('should see the uncommitted post2 insert from the same transaction',
      expectToFindPosts(post2, 1, true));

    it('should rollback a transaction', function(done) {
      currentTx.rollback(done);
    });

    it('should not see the rolledback post1 insert', expectToFindPosts(post1, 0));

    it('should not see the rolledback post2 insert', expectToFindPosts(post2, 0));
  });
});

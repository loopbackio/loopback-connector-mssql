// Copyright IBM Corp. 2015,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
require('./init');

var should = require('should');
var Post, PostWithUUID, PostWithStringId, db;

describe('mssql connector', function() {
  before(function() {
    /* global getDataSource */
    db = getDataSource();

    Post = db.define('PostWithBoolean', {
      title: {type: String, length: 255, index: true},
      content: {type: String},
      approved: Boolean,
    });

    PostWithUUID = db.define('PostWithUUID', {
      id: {type: String, generated: true, id: true},
      title: {type: String, length: 255, index: true},
      content: {type: String},
      approved: Boolean,
    });

    PostWithStringId = db.define('PostWithStringId', {
      id: {type: String, id: true, generated: false},
      title: {type: String, length: 255, index: true},
      content: {type: String},
      rating: {type: Number, mssql: {dataType: 'FLOAT'}},
      approved: Boolean,
    });
  });

  it('should run migration', function(done) {
    db.automigrate(['PostWithBoolean', 'PostWithUUID', 'PostWithStringId'],
      function(err) {
        done(err);
      });
  });

  var post;
  it('should support boolean types with true value', function(done) {
    Post.create({title: 'T1', content: 'C1', approved: true}, function(err, p) {
      should.not.exists(err);
      post = p;
      Post.findById(p.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('approved', true);
        done();
      });
    });
  });

  it('should support updating boolean types with false value', function(done) {
    Post.update({id: post.id}, {approved: false}, function(err) {
      should.not.exists(err);
      Post.findById(post.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('approved', false);
        done();
      });
    });
  });

  it('should support boolean types with false value', function(done) {
    Post.create({title: 'T2', content: 'C2', approved: false}, function(err, p) {
      should.not.exists(err);
      post = p;
      Post.findById(p.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('approved', false);
        done();
      });
    });
  });

  it('should single quote escape', function(done) {
    Post.create({title: 'T2', content: 'C,D', approved: false}, function(err, p) {
      should.not.exists(err);
      post = p;
      Post.findById(p.id, function(err, p) {
        should.not.exists(err);
        p.should.have.property('content', 'C,D');
        done();
      });
    });
  });

  it('should return the model instance for upsert', function(done) {
    Post.upsert({id: post.id, title: 'T2_new', content: 'C2_new',
      approved: true}, function(err, p) {
      p.should.have.property('id', post.id);
      p.should.have.property('title', 'T2_new');
      p.should.have.property('content', 'C2_new');
      p.should.have.property('approved', true);
      done();
    });
  });

  it('should return the model instance for upsert when id is not present',
    function(done) {
      Post.upsert({title: 'T2_new', content: 'C2_new', approved: true},
        function(err, p) {
          p.should.have.property('id');
          p.should.have.property('title', 'T2_new');
          p.should.have.property('content', 'C2_new');
          p.should.have.property('approved', true);
          done();
        });
    });

  it('should escape number values to defect SQL injection in findById',
    function(done) {
      Post.findById('(SELECT 1+1)', function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find',
    function(done) {
      Post.find({where: {id: '(SELECT 1+1)'}}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find with gt',
    function(done) {
      Post.find({where: {id: {gt: '(SELECT 1+1)'}}}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find - test 2',
    function(done) {
      Post.find({limit: '(SELECT 1+1)'}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should escape number values to defect SQL injection in find with inq',
    function(done) {
      Post.find({where: {id: {inq: ['(SELECT 1+1)']}}}, function(err, p) {
        should.exists(err);
        done();
      });
    });

  it('should avoid SQL injection for parameters containing (?)',
    function(done) {
      var connector = db.connector;
      var value1 = '(?)';
      var value2 = ', 1 ); INSERT INTO SQLI_TEST VALUES (1, 2); --';

      connector.execute('DROP TABLE SQLI_TEST;', function(err) {
        connector.execute('CREATE TABLE SQLI_TEST' +
          '(V1 VARCHAR(100), V2 VARCHAR(100) )',
        function(err) {
          if (err) return done(err);
          connector.execute('INSERT INTO SQLI_TEST VALUES ( (?), (?) )',
            [value1, value2], function(err) {
              if (err) return done(err);
              connector.execute('SELECT * FROM SQLI_TEST', function(err, data) {
                if (err) return done(err);
                data.should.be.eql(
                  [{V1: '(?)',
                    V2: ', 1 ); INSERT INTO SQLI_TEST VALUES (1, 2); --'}]
                );
                done();
              });
            });
        });
      });
    });

  it('should allow string array for inq',
    function(done) {
      Post.find({where: {content: {inq: ['C1', 'C2']}}}, function(err, p) {
        should.not.exist(err);
        should.exist(p);
        p.should.have.length(2);
        done();
      });
    });

  it('should perform an empty inq',
    function(done) {
      Post.find({where: {id: {inq: []}}}, function(err, p) {
        should.not.exist(err);
        should.exist(p);
        p.should.have.length(0);
        done();
      });
    });

  it('should perform an empty nin',
    function(done) {
      Post.find({where: {id: {nin: []}}}, function(err, p) {
        should.not.exist(err);
        should.exist(p);
        p.should.have.length(4);
        done();
      });
    });

  it('should support uuid', function(done) {
    PostWithUUID.create({title: 'T1', content: 'C1', approved: true},
      function(err, p) {
        should.not.exists(err);
        p.should.have.property('id');
        // p.id.should.be.a.string();
        PostWithUUID.findById(p.id, function(err, p) {
          should.not.exists(err);
          p.should.have.property('title', 'T1');
          done();
        });
      });
  });

  it('should support string id', function(done) {
    PostWithStringId.create(
      {title: 'T1', content: 'C1', approved: true, rating: 3.5},
      function(err, p) {
        should.not.exists(err);
        p.should.have.property('id');
        p.id.should.be.a.string;
        PostWithStringId.findById(p.id, function(err, p) {
          should.not.exists(err);
          p.should.have.property('title', 'T1');
          p.should.have.property('rating', 3.5);
          done();
        });
      }
    );
  });

  context('regexp operator', function() {
    beforeEach(function deleteExistingTestFixtures(done) {
      Post.destroyAll(done);
    });
    beforeEach(function createTestFixtures(done) {
      Post.create([
        {title: 'a', content: 'AAA'},
        {title: 'b', content: 'BBB'},
      ], done);
    });
    beforeEach(function addSpy() {
      /* global sinon */
      sinon.stub(console, 'warn');
    });
    afterEach(function removeSpy() {
      console.warn.restore();
    });
    after(function deleteTestFixtures(done) {
      Post.destroyAll(done);
    });

    context('with regex strings', function() {
      it('should print a warning and return an error', function(done) {
        Post.find({where: {content: {regexp: '^A'}}}, function(err, posts) {
          console.warn.calledOnce.should.be.ok;
          should.exist(err);
          done();
        });
      });
    });

    context('with regex literals', function() {
      it('should print a warning and return an error', function(done) {
        Post.find({where: {content: {regexp: /^A/}}}, function(err, posts) {
          console.warn.calledOnce.should.be.ok;
          should.exist(err);
          done();
        });
      });
    });

    context('with regex objects', function() {
      it('should print a warning and return an error', function(done) {
        Post.find(
          {where: {content: {regexp: new RegExp(/^A/)}}},
          function(err, posts) {
            console.warn.calledOnce.should.be.ok;
            should.exist(err);
            done();
          }
        );
      });
    });
  });
});

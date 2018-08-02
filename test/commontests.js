// Copyright IBM Corp. 2013,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var jdb = require('loopback-datasource-juggler');
var commonTest = jdb.test;

require('./init');

/* global getDataSource */
var schema = getDataSource();

// run the tests exposed by jugglingdb
commonTest(module.exports, schema);

// skip the order test from jugglingdb, it wasn't working right
commonTest.skip('should handle ORDER clause');

// re-implement the order test as pretty much the same thing, but run an automigration beforehand
commonTest.it('should automigrate', function(test) {
  schema.automigrate(function(err) {
    test.ifError(err);
    test.done();
  });
});

commonTest.it('should be able to ORDER results', function(test) {
  var titles = [
    {title: 'Title A', subject: 'B'},
    {title: 'Title Z', subject: 'A'},
    {title: 'Title M', subject: 'C'},
    {title: 'Title A', subject: 'A'},
    {title: 'Title B', subject: 'A'},
    {title: 'Title C', subject: 'D'},
  ];

  var dates = [
    new Date(1000 * 5),
    new Date(1000 * 9),
    new Date(1000 * 0),
    new Date(1000 * 17),
    new Date(1000 * 10),
    new Date(1000 * 9),
  ];

  titles.forEach(function(t, i) {
    schema.models.Post.create({title: t.title, subject: t.subject, date: dates[i]}, done);
  });
  var i = 0;
  var tests = 0;
  function done(err, obj) {
    if (++i === titles.length) {
      doFilterAndSortTest();
      doFilterAndSortReverseTest();
      doStringTest();
      doNumberTest();
      doMultipleSortTest();
      doMultipleReverseSortTest();
    }
  }

  function compare(a, b) {
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  }

  function doStringTest() {
    tests += 1;
    schema.models.Post.all({order: 'title'}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      titles.sort(compare).forEach(function(t, i) {
        if (posts[i]) test.equal(posts[i].title, t.title);
      });
      finished();
    });
  }

  function doNumberTest() {
    tests += 1;
    schema.models.Post.all({order: 'date'}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      dates.sort(numerically).forEach(function(d, i) {
        if (posts[i])
          test.equal(posts[i].date.toString(), d.toString(), 'doNumberTest');
      });
      finished();
    });
  }

  function doFilterAndSortTest() {
    tests += 1;
    schema.models.Post.all({where: {date: new Date(1000 * 9)}, order: 'title', limit: 3}, function(err, posts) {
      if (err) console.log(err);
      console.log(posts.length);
      test.equal(posts.length, 2, 'Exactly 2 posts returned by query');
      ['Title C', 'Title Z'].forEach(function(t, i) {
        if (posts[i]) {
          test.equal(posts[i].title, t, 'doFilterAndSortTest');
        }
      });
      finished();
    });
  }

  function doFilterAndSortReverseTest() {
    tests += 1;
    schema.models.Post.all({where: {date: new Date(1000 * 9)}, order: 'title DESC', limit: 3},
      function(err, posts) {
        if (err) console.log(err);
        test.equal(posts.length, 2, 'Exactly 2 posts returned by query');
        ['Title Z', 'Title C'].forEach(function(t, i) {
          if (posts[i]) {
            test.equal(posts[i].title, t, 'doFilterAndSortReverseTest');
          }
        });
        finished();
      });
  }

  function doMultipleSortTest() {
    tests += 1;
    schema.models.Post.all({order: 'title ASC, subject ASC'}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      test.equal(posts[0].title, 'Title A');
      test.equal(posts[0].subject, 'A');
      test.equal(posts[1].title, 'Title A');
      test.equal(posts[1].subject, 'B');
      test.equal(posts[5].title, 'Title Z');
      finished();
    });
  }

  function doMultipleReverseSortTest() {
    tests += 1;
    schema.models.Post.all({order: 'title ASC, subject DESC'}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      test.equal(posts[0].title, 'Title A');
      test.equal(posts[0].subject, 'B');
      test.equal(posts[1].title, 'Title A');
      test.equal(posts[1].subject, 'A');
      test.equal(posts[5].title, 'Title Z');
      finished();
    });
  }

  var fin = 0;
  function finished() {
    if (++fin === tests) {
      test.done();
    }
  }

  // TODO: do mixed test, do real dates tests, ensure that dates stored in UNIX timestamp format

  function numerically(a, b) {
    return a - b;
  }
});

commonTest.it('should count posts', function(test) {
  test.expect(2);
  schema.models.Post.count({title: 'Title A'}, function(err, cnt) {
    test.ifError(err);
    test.equal(cnt, 2);
    test.done();
  });
});

commonTest.it('should delete a post', function(test) {
  schema.models.Post.all({
    where: {
      title: 'Title Z',
    },
  }, function(err, posts) {
    test.ifError(err);
    test.equal(posts.length, 1);
    var id = posts[0].id;
    posts[0].destroy(function(err) {
      test.ifError(err);
      schema.models.Post.find(id, function(err, post) {
        test.ifError(err);
        test.equal(post, null);
        test.done();
      });
    });
  });
});

commonTest.it('should delete all posts', function(test) {
  test.expect(3);
  schema.models.Post.destroyAll(function(err) {
    test.ifError(err);
    schema.models.Post.count(function(err, cnt) {
      test.ifError(err);
      test.equal(cnt, 0);
      test.done();
    });
  });
});

// custom primary keys not quite working :(, hopefully 1602 will implement that functionality in jugglingdb soon.
commonTest.it('should support custom primary key', function(test) {
  test.expect(3);
  var AppliesTo = schema.define('AppliesTo', {
    AppliesToID: {
      type: Number,
      primaryKey: true,
    },
    Title: {
      type: String,
      limit: 100,
    },
    Identifier: {
      type: String,
      limit: 100,
    },
    Editable: {
      type: Number,
    },
  });

  schema.automigrate(function(err) {
    test.ifError(err);
    AppliesTo.create({Title: 'custom key', Identifier: 'ck', Editable: false}, function(err, data) {
      test.ifError(err);
      test.notStrictEqual(typeof data.AppliesToID, 'undefined');
      test.done();
    });
  });
});

var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    commonTest = jdb.test,
    db = require("../db/dbconfig");

var adapter = require("../");
var schemaSettings = { host:db.server, database:db.db, username:db.user, password:db.pwd };
var schema = new Schema(adapter, schemaSettings);

//run the tests exposed by jugglingdb
commonTest(module.exports, schema);

//skip the order test from jugglingdb, it wasn't working right
commonTest.skip('should handle ORDER clause');

//re-implement the order test as pretty much the same thing, but run an automigration beforehand
commonTest.it('should automigrate', function(test) {
	schema.automigrate(function (err) {
		test.ifError(err);
		test.done();
	});
});

commonTest.it('should be able to ORDER results', function(test) {
	var titles = [ { title: 'Title A', subject: "B" },
                 { title: 'Title Z', subject: "A" },
                 { title: 'Title M', subject: "C" },
                 { title: 'Title A', subject: "A" },
                 { title: 'Title B', subject: "A" },
                 { title: 'Title C', subject: "D" }];

  var dates = [
    new Date(1000 * 5 ),
    new Date(1000 * 9),
    new Date(1000 * 0),
    new Date(1000 * 17),
    new Date(1000 * 10),
    new Date(1000 * 9)
  ];

  titles.forEach(function (t, i) {
    schema.models.Post.create({title: t.title, subject: t.subject, date: dates[i]}, done);
  });

  var i = 0, tests = 0;
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
    schema.models.Post.all({order: 'title'}, function (err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      titles.sort(compare).forEach(function (t, i) {
        if (posts[i]) test.equal(posts[i].title, t.title);
      });
      finished();
    });
  }

  function doNumberTest() {
    tests += 1;
    schema.models.Post.all({order: 'date'}, function (err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      dates.sort(numerically).forEach(function (d, i) {
        if (posts[i])
        test.equal(posts[i].date.toString(), d.toString(), 'doNumberTest');
      });
      finished();
    });
  }

  function doFilterAndSortTest() {
    tests += 1;
    schema.models.Post.all({where: {date: new Date(1000 * 9)}, order: 'title', limit: 3}, function (err, posts) {
      if (err) console.log(err);
      console.log(posts.length);
      test.equal(posts.length, 2, 'Exactly 2 posts returned by query');
      [ 'Title C', 'Title Z' ].forEach(function (t, i) {
        if (posts[i]) {
          test.equal(posts[i].title, t, 'doFilterAndSortTest');
        }
      });
      finished();
    });
  }

  function doFilterAndSortReverseTest() {
    tests += 1;
    schema.models.Post.all({where: {date: new Date(1000 * 9)}, order: 'title DESC', limit: 3}, function (err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 2, 'Exactly 2 posts returned by query');
      [ 'Title Z', 'Title C' ].forEach(function (t, i) {
        if (posts[i]) {
          test.equal(posts[i].title, t, 'doFilterAndSortReverseTest');
        }
      });
      finished();
    });
  }

  function doMultipleSortTest() {
    tests += 1;
    schema.models.Post.all({order: "title ASC, subject ASC"}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      test.equal(posts[0].title, "Title A");
      test.equal(posts[0].subject, "A");
      test.equal(posts[1].title, "Title A");
      test.equal(posts[1].subject, "B");
      test.equal(posts[5].title, "Title Z");
      finished();
    });
  }

  function doMultipleReverseSortTest() {
    tests += 1;
    schema.models.Post.all({order: "title ASC, subject DESC"}, function(err, posts) {
      if (err) console.log(err);
      test.equal(posts.length, 6);
      test.equal(posts[0].title, "Title A");
      test.equal(posts[0].subject, "B");
      test.equal(posts[1].title,"Title A");
      test.equal(posts[1].subject, "A");
      test.equal(posts[5].title, "Title Z");
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
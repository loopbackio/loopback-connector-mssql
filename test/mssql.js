var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    commonTest = jdb.test,
    db = require("../db/dbconfig");

var adapter = require("../");
schemaSettings = { host:db.server, database:db.db, username:db.user, password:db.pwd };
var schema = new Schema(adapter, schemaSettings);

exports.mssql = function(test) {
	//test.expect(5);

	schema.on("connected", function() {

		var Post, User, Passport, Log, Dog;

		User = schema.define('User', {
		    name:      { type: String, index: true },
		    email:     { type: String, index: true },
		    bio:          Schema.Text,
		    approved:     Boolean,
		    joinedAt:     Date,
		    age:          Number,
		    passwd:    { type: String, index: true }
		});

		Dog = schema.define('Dog', {
		    name        : { type: String, limit: 64, allowNull: false }
		});

		Log = schema.define('Log', {
		    ownerId     : { type: Number, allowNull: true },
		    name         : { type: String, limit: 64, allowNull: false }
		});

		Log.belongsTo(Dog,  {as: 'owner',  foreignKey: 'ownerId'});

		schema.extendModel('User', {
		    settings:  { type: Schema.JSON },
		    extra:      Object
		});

		var newuser = new User({settings: {hey: 'you'}});
		//test.ok(newuser.settings);

		Post = schema.define('Post', {
		    title:     { type: String, length: 255, index: true },
		    subject:   { type: String },
		    content:   { type: Schema.Text },
		    date:      { type: Date,    default: function () { return new Date }, index: true },
		    published: { type: Boolean, default: false, index: true },
		    likes:     [],
		    related:   [RelatedPost]
		}, {table: 'posts'});

		function RelatedPost() { }
		RelatedPost.prototype.someMethod = function () {
		    return this.parent;
		};

		Post.validateAsync('title', function (err, done) {
		    process.nextTick(done);
		});

		User.hasMany(Post,   {as: 'posts',  foreignKey: 'userId'});
		// creates instance methods:
		// user.posts(conds)
		// user.posts.build(data) // like new Post({userId: user.id});
		// user.posts.create(data) // build and save
		// user.posts.find

		// User.hasOne('latestPost', {model: Post, foreignKey: 'postId'});

		// User.hasOne(Post,    {as: 'latestPost', foreignKey: 'latestPostId'});
		// creates instance methods:
		// user.latestPost()
		// user.latestPost.build(data)
		// user.latestPost.create(data)

		Post.belongsTo(User, {as: 'author', foreignKey: 'userId'});
		// creates instance methods:
		// post.author(callback) -- getter when called with function
		// post.author() -- sync getter when called without params
		// post.author(user) -- setter when called with object

		Passport = schema.define('Passport', {
		    number: String
		});

		Passport.belongsTo(User, {as: 'owner', foreignKey: 'ownerId'});
		User.hasMany(Passport,   {as: 'passports', foreignKey: 'ownerId'});

		var user = new User;

		//test.ok(User instanceof Function);

		// class methods
		//test.ok(User.find instanceof Function);
		//test.ok(User.create instanceof Function);

		// instance methods
		//test.ok(user.save instanceof Function);
		schema.automigrate(function (err) {
	    if (err) {
	        console.log('Error while migrating');
	        console.log(err);
	    } else {
	        //test.done();
	    }
		});
	});
}


//demonstrate that msnodesql doesn't choke on '\r\n' or the GO keyword
exports.goTest = function() {

	var mssql = require("msnodesql");

	var conn_str = "Driver={SQL Server Native Client 11.0};Server="+db.server+";";

  //if we have a username and password then we use a credential connection string
  if (db.user && db.db) {
    conn_str += "UID="+db.user+";PWD="+db.pwd+";Database={"+db.db+"};"
  } else {
    conn_str += trusted_str
  }

	mssql.open(conn_str, function(err, conn){
    if (err)
      throw err

    conn.query("\r\nSELECT * FROM Passport\r\nGO\r\nSELECT * FROM Log\r\nGO\r\n", function(err, results) {
    	console.log(results.length);
    	console.log(results);
    });
    
  });

}


exports.mssql(null);
//exports.goTest();
//commonTest(module.exports, schema);
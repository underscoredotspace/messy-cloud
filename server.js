var config = require('./config.js');
var _ = require('underscore');

// Start up mongodb connection
var mongodb = require('mongodb').MongoClient;
var db = require('./util/mongodb');

// Set up Express requirements
var app = require('express')();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');

// Session support for auth
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({url: config.mongo.address})
var cookieParser = require('cookie-parser');
// Passport auth
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

// Set up Passport Twitter auth process
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumer_key,
    consumerSecret: config.twitter.consumer_secret,
    callbackURL: config.twitter.callbackURL
  },
  function(token, tokenSecret, profile, cb) {
    console.log(Date() + ': Twitter user ' + profile._json.screen_name + ' logged in');
    var users = db.get().collection('users');
    users.find({id: profile._json.id}).limit(1).toArray(function(err, user){
      if (user.length>0) {
        //*** Update user record
        returnUser = user[0];
      } else {
        returnUser = _.extend(profile._json, {registered: false, admin: false});
        users.insert(returnUser);
      }
      console.log(Date() + ': Twitter user ' + profile._json.screen_name + ' registered==' + returnUser.registered);
      return cb(null, returnUser);
    })
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Set up session cookie for Express
app.use(session({
  key: config.passport.key, 
  secret: config.passport.secret, 
  store: sessionStore, 
  saveUninitialized: false, 
  resave: false, 
  cookie: { secure: 'auto' }
}));

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Setup for dealing with POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// We return here from Twitter after auth request
app.use('/login/twitter/callback',  
  passport.authenticate('twitter', {failureRedirect: '/login'}), 
  function (req, res) {
    res.redirect('/');
  });

// Send auth request to Twitter
app.use('/login/twitter',  
  passport.authenticate('twitter')
);

// All other routes
app.use('/', require('./routes'));

// CONNECT TO MONGO
db.connect(config.mongo.address, function(err) {
  if (err) {
    console.error(err);
    process.exit(1)
  } else {

    // START THE SERVER
    server.listen(3000, '127.0.0.1', function() {
      console.log(Date() + ': Express listening on port 3000')
    }).on('error', function(err) {
      // Log and quit on any errors with the http server
      console.error(err);
      process.exit(1)
    });
  }
})

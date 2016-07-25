var config = require('./config.js');
var _ = require("underscore");

// Start up mongodb connection
var mongodb = require('mongodb').MongoClient;
var db = require('./mongodb');

// Set up Express requirements
var app = require('express')();
var bodyParser = require('body-parser');

// Authentication with passport and passportSocketIo
// Session support for auth
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({url: config.mongo.address})
var cookieParser = require('cookie-parser');
// Passport auth
var passport = require('passport');
var passportSocketIo = require("passport.socketio");
var TwitterStrategy = require('passport-twitter').Strategy;
// Link socket.io and Express
var server = require("http").createServer(app);
var io = require('socket.io').listen(server);

// Set up Passport Twitter auth process
passport.use(new TwitterStrategy({
    consumerKey: config.twitter.consumer_key,
    consumerSecret: config.twitter.consumer_secret,
    callbackURL: config.twitter.callbackURL
  },
  function(token, tokenSecret, profile, cb) {
    var users = db.get().collection('users');
    users.find({id: profile._json.id}).limit(1).toArray(function(err, user){
      if (user.length>0) {
        //*** Update user record
        returnUser = user[0];
      } else {
        returnUser = _.extend(profile._json, {registered: false, admin: false});
        users.insert(returnUser);
      }
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

// Passport-socket.io setup
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:          config.passport.key,
  secret:       config.passport.secret,
  store:        sessionStore,
  success:      onAuthorizeSuccess,
  fail:         onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept){
  accept();
}

function onAuthorizeFail(data, message, error, accept){
  accept(new Error(message));
}

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
    console.log(Date() + ': ' + 'Unable to connect to Mongo.')
    process.exit(1)
  } else {

    // START THE SERVER
    server.listen(3000, '127.0.0.1', function() {
      console.log(Date() + ': Express listening on port 3000')

      // LISTEN TO SOCKETS
      io.sockets.on('connection', function (socket) {
        console.log(Date() + ': ' + socket.request.user.screen_name + '@' + socket.id + ' connected');

        socket.on('disconnect', function() {
          console.log(Date() + ': ' + socket.request.user.screen_name + '@' + socket.id + ' disconnected');
        }); 

        socket.on('test', function(message) {
          console.log('test message recieved: ' + message);
        })

        // DISCONNECT UNREGISTERED USERS
        if (socket.request.user.registered==true) {
          console.log(Date() + ': registered user connected to socket.io');
        } else {
          socket.disconnect();
          console.log(Date() + ': unregistered user attempted to connect to socket.io');
        }
      });
    }).on('error', console.log);
  }
})

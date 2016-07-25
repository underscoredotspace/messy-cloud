var config = require('./config.js');
var _ = require("underscore");

// Start up mongodb connection
var mongodb = require('mongodb').MongoClient;
var db = require('./mongodb');

// Set up Express requirements
var app = require('express')();

// Authentication with passport and passportSocketIo
var connectMongo = require('connect-mongo');
var session = require('express-session');
var MongoStore = connectMongo(session);
var sessionStore = new MongoStore({url: config.mongo.address})
var cookieParser = require('cookie-parser');
var passport = require('passport');
var passportSocketIo = require("passport.socketio");
var socketio = require('socket.io');
var http = require("http");
var server = http.createServer(app);
var io = socketio.listen(server);
var Strategy = require('passport-twitter').Strategy;

passport.use(new Strategy({
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

app.use('/login/twitter/callback',  
  passport.authenticate('twitter', {failureRedirect: '/login'}), 
  function (req, res) {
    res.redirect('/');
  });

app.use('/login/twitter',  
  passport.authenticate('twitter')
);

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
          console.log('test message: ' + message);
        })

        // BIN UNREGISTERED USERS
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

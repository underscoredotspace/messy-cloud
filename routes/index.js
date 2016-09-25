const routes = require('express').Router();
var db = require('../util/mongodb');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

// ## TODO ## - only use if not production
routes.use(function(req, res, next) {
  console.info(Date() + ': ' + req.method + ' request for ' + req.url);
  next()
});

routes.get('/login', function(req, res) {
  if (req.hasOwnProperty('user')) {
    if (req.user.registered) {
      res.redirect('/');
    } else {
      res.redirect('/register');
    }
  } else {
    res.sendFile('views/public/login.html', { root: "."});
  }
});

routes.get('/register', function(req, res) {
  if (req.hasOwnProperty('user')) {
    if (req.user.registered) {
      res.redirect('/');
    } else {
      res.sendFile('views/public/register.html', { root: "."});
    }
  } else {
    res.redirect('/login');
  }
});

routes.get('/public/*', function(req, res) {
  res.sendFile('views' + req.url + '.html', { root: "."})
});

routes.get('/logout', function(req, res) {
  console.log(Date() + ': Twitter user ' + req.user.screen_name + ' logged out');
  req.logout();
  res.redirect('/');
});

routes.use('/api', require('./api'))

routes.use(ensureLoggedIn('/login'), function(req, res, next) {
    // Check for registered
    if (req.user.registered==true) {
      next();
    } else {
      res.redirect('/register');
    }
});

// Should only get here if logged in, registered for any non-api requests
routes.get('*', function (req, res) {
  res.sendFile('views/private' + req.url, { root: "."})
});

module.exports = routes;
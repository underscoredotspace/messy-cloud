var routes = require('express').Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

// Routes that can be accessed while logged in but still not registered
routes.use(function(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(403);
  }
});

routes.get('/', function(req, res) {
  res.status(400).json({error: 'missing option'});
});

// send one part of user record
routes.get('/aboutme/:element', function(req, res) {
  res.status(200).json(req.user[req.params.element]);
});

// send whole of user record
routes.get('/aboutme', function(req, res) {
  res.status(200).json(req.user);
});

// Routes that can only be accessed while logged in and registered
routes.use(function (req, res, next) {
    if (req.user.registered) {
      next()
    } else {
      res.sendStatus(401);
    }
});

// Routes that can only be accessed by logged in admin users
routes.use('/admin', require('./admin.js'));

routes.use(function(req, res) {
  res.sendStatus(404);
})

module.exports = routes;
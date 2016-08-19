const routes = require('express').Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

// Don't like this, but we end up here if API req from client not logged in
//** Look at API tokens to replace this
routes.use('/403', function(req, res) {
  res.sendStatus(403);
})

// Routes that can be accessed while logged in but still not registered
routes.use(ensureLoggedIn('/api/403'), function(req, res, next) {
  next();
});

// send one part of user record
routes.get('/aboutme/:element', function(req, res) {
  res.status(200).json(req.user[req.params.element]);
});

// send whole of user record
routes.get('/aboutme', function(req, res) {
  res.status(200).json(req.user);
});

routes.use(function(req, res) { 
  res.sendStatus(418);
})

// Routes that can only be accessed while logged in and registered
routes.use(function (req, res, next) {
    if (req.user.registered) {
      next()
    } else {
      res.status(401);
    }
});

// Routes that can only be accessed by logged in admin users
routes.use('/admin', require('./admin.js'));

routes.use(function(req, res) {
  res.sendStatus(404);
})

module.exports = routes;
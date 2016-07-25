const routes = require('express').Router();

// Routes that can be accessed while logged in but still not registered
routes.get('/aboutme/:element', function(req, res) {
  // send one part of user record
  res.status(200).json(req.user[req.params.element]);
});

routes.get('/aboutme', function(req, res) {
  // send whole of user record
  res.status(200).json(req.user);
});

// Routes that can only be accessed while logged in and registered
routes.use(function (req, res, next) {
  if (req.hasOwnProperty('user')) {
    next();
  } else {
    res.status(401);
  }
});

routes.use('/fs', require('./filesystem.js'));

// Routes that can only be accessed by logged in admin users
routes.use('/admin', require('./admin.js'));

routes.get('/test', function(req, res) {
    res.status(200).json({test: 'api'});
});

routes.use('*', function(req, res) {
  res.sendStatus(404);
})

module.exports = routes;
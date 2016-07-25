const routes = require('express').Router();

// Routes that can be accessed while logged in but still not registered
routes.get('/aboutme', function(req, res) {
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

// Routes that can only be accessed by logged in admin users
routes.use('/admin', require('./admin.js'))

routes.use('/test', function (req, res) {
  res.status(200).json({ method: req.method, message: req.query });
});

routes.use('*', function(req, res) {
  res.sendStatus(404);
})

module.exports = routes;
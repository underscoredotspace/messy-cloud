const routes = require('express').Router();

routes.use(function(req, res, next) {
  if (req.user.admin) {
    next();
  } else {
    res.status(301).json({error: 'Access is denied'});
  }
});

routes.get('*', function (req, res) {
  res.sendStatus(404);
});

module.exports = routes;
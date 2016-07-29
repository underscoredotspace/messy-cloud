const routes = require('express').Router();
const messy = require('../util/messy');
const fsRoot = './uploads'; //** to be validated somewhere on startup
var _ = require("underscore");

routes.get('/test', function(req, res) {
    res.status(200).json({test: 'fs'});
});

routes.route('/folder')
  .get(function(req, res) {
      if(req.headers.hasOwnProperty('path')) {
        res.status(200).json({action: 'list', path: req.headers.path, dir: 'dir listing'});
      } else {
        res.status(400).json({err: 'path required'});
      }
  })
  .post(function(req, res) {
    // Request to create a new folder
    if(req.headers.hasOwnProperty('location') && req.headers.hasOwnProperty('name')) {
      messy.fs.mkdir(fsRoot + '/' + req.headers.location + '/' + req.headers.name, function(err, success) {
        if (!err) {
          console.log(success);
          res.status(200).json(success);
        } else {
          res.status(400).json({action: 'mkdir', err: err});
        }
      })
    } else { 
        res.status(400).json({err: 'location and name required'});
    }
  })
  .put(function(req, res) {
    // Request to rename existing folder 
    res.status(200).json({action: 'rename', dir: 'dir listing'});
  })
  .delete(function(req, res) {
    // Request to delete folder
    if(req.headers.hasOwnProperty('name')) {
      messy.fs.rmdir(fsRoot + '/' + req.headers.name, function(err, result) {
        if (!err) {
          console.log({success: result});
          res.status(200).json({success: result});
        } else {
          res.status(500).json({action: 'rmdir', err: err});
        }
      })
    } else { 
        res.status(400).json({err: 'name required'});
    }

  });

routes.use('*', function(req, res) {
  res.sendStatus(404);
});

module.exports = routes;
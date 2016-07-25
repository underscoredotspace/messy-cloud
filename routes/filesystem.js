const routes = require('express').Router();
const fs = require('fs');
const fsRoot = './uploads';
var _ = require("underscore");

routes.get('/test', function(req, res) {
    res.status(200).json({test: 'fs'});
});

routes.post('/ls/*', function(req, res) {
    messyfs.ls('/' + req.body.dir, function(err, files, folders) {
        if(!err) {
            res.status(200).json({dir: req.body.dir, folders: folders, files: files});
        } else {
            res.status(500).json({err: err});
        }
    });
})

routes.get('/ls/:dir', function(req, res) {
    messyfs.ls('/' + req.params.dir, function(err, files, folders) {
        if(!err) {
            res.status(200).json({dir: '/' + req.params.dir, folders: folders, files: files});
        } else {
            res.status(500).json({err: err});
        }
    });
});

routes.get('/ls', function(req, res) {
    messyfs.ls('/', function(err, files, folders) {
        if(!err) {
            res.status(200).json({dir: '/', folders: folders, files: files});
        } else {
            res.status(500).json({err: err});
        }
    });
});

routes.use('*', function(req, res) {
  res.sendStatus(404);
});

messyfs = {
    ls: function(path, callback) {
        var folders = [];
        var files = [];
        fs.readdir(fsRoot + path, function(err, filelist) {
            if (!err) {
                _.each(filelist, function(item) {
                    if (fs.statSync(fsRoot + path + '/' + item).isDirectory()) {
                        folders.push(item + '/');
                    } else {
                        files.push(item);
                    }
                });
                callback(err, files, folders);
            } else {
                callback(err, null, null);
            }
        });
    }
}

module.exports = routes;
nodefs = require('fs');
path = require('path');
db = require('./mongodb');

messy = {
    fs: {
        mkdir: function (folderName, callback)  {
            folderName = messy.removeDupeSlash(folderName);
            nodefs.mkdir(folderName, function(err) {
                if (!err) {
                    callback(err, {mkdir: folderName});
                    //** create link in database
                } else {
                    if (err.errno==-2) {
                        messy.fs.mkdir(path.dirname(folderName), function (err) {
                            if (!err) {
                                messy.fs.mkdir(folderName, callback);
                            }
                        });
                    } else {   
                        callback(err, null);
                    }
                }
            });
        }
    },
    removeDupeSlash: function (withSlashes) {
        // Remove duplicate slashes in file path, so if passed '///upload//path/' will return '/upload/path/'
        return withSlashes.replace(/\/{2,}/g, '/');
    }
}

module.exports = messy;
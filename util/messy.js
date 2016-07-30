nodefs = require('fs');
path = require('path');
db = require('./mongodb');
async = require('async')

messy = {
  fs: {
      mkdir: function (folderName, callback)  {
          folderName = messy.cleanFolder(folderName);
          nodefs.mkdir(folderName, function(err) {
              if (!err) {
                  // folder (and potentially parent(s)) created successfully
                  callback(err, {mkdir: folderName});
              } else {
                  // if parent folder doesn't exist
                  if (err.errno==-2) {
                      // try to create parent folder
                      messy.fs.mkdir(path.dirname(folderName), function (err) {
                          // if above worked, try again to create folder retaining our calback
                          if (!err) {
                              messy.fs.mkdir(folderName, callback);
                          } else {
                              // something really bad happened so let's fail out
                              console.error('something bad happened in messy.fs.mkdir');
                              callback(err, null);
                          }
                      })
                  } else {   
                      // if some other failure pass to callback
                      callback(err, null);
                  }
              }
          });
      },
      rmdir: function(folderName, callback) {
        folderName = messy.cleanFolder(folderName);
        // Try to delete folder
        nodefs.rmdir(folderName, function (err) {
          if (!err) {
            // Successfull delete, execute callback
            callback(err, {rmdir0: folderName});
          } else {
            if (err.errno==-66) {
              nodefs.readdir(folderName, function (err, items) {
                calls = [];
                items.forEach(function (item) {
                  // cb is callabck for async.parallel function below
                  calls.push(function(cb) {
                    itemFull = messy.removeDupeSlash(folderName + '/' + item);
                    nodefs.stat(itemFull, function(err, itemstat) {
                      if (itemstat.isDirectory()) {
                        // Item is a folder, recurse
                        messy.fs.rmdir(itemFull, function(err) {
                          return cb(err, {rmdir1: itemFull});
                        })
                      } else {
                        // Item is a file, delete it
                        nodefs.unlink(itemFull, function(err) {
                          return cb(err, {unlink: itemFull});
                        })
                      }
                    }) // end of nodefs.stat
                  })
                }) // end of forEach
              async.parallel(calls, function(err, result) {
                if (err) {
                  console.log(err);
                  // If any of our cb results above were errors return that fail
                  return callback(err, null);
                } else {
                // Try delete folder again  
                  nodefs.rmdir(folderName, function(err) {
                    // End of the function, passes of fails at this point and as such
                    callback(err, {rmdir2: folderName}); 
                  })
                }
              })
              }) // end of rnodefs.readdir
            } else {
              // Some other error
              callback(err, {rmdir3: folderName});
            }
          }
        })
      }
  },
  cleanFolder: function (dirtyFolder) {
    // Remove duplicate slashes in file path, so if passed '///upload//path/' will return '/upload/path/'
    // Remove any '..' so we can't do anything outside of fsRoot
    return dirtyFolder.replace('..', '').replace(/\/{2,}/g, '/');
  }
}

module.exports = messy;
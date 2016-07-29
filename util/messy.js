nodefs = require('fs');
path = require('path');
db = require('./mongodb');
async = require('async')

messy = {
  fs: {
      mkdir: function (folderName, callback)  {
          folderName = messy.removeDupeSlash(folderName);
          nodefs.mkdir(folderName, function(err) {
              if (!err) {
                  // folder (and potentially parent(s)) created successfully
                  callback(err, {mkdir: folderName});
                  //** create link in database
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
                    }) // end it nodefs.stat
                  })
                }) // end of forEach
              // Try delete folder again
              async.parallel(calls, function(err, result) {
                if (err) {
                  console.log(err);
                  return callback(err, null);
                } else {
                  nodefs.rmdir(folderName, function(err) {
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
  removeDupeSlash: function (withSlashes) {
    // Remove duplicate slashes in file path, so if passed '///upload//path/' will return '/upload/path/'
    return withSlashes.replace(/\/{2,}/g, '/');
  }
}

module.exports = messy;

/*
        nodefs.rmdir(folderName, function(err) {
          if (!err) {
            // No error on this cycle, pass niceness back to callback
            callback(err, {rmdir: folderName});
          } else {
            // if folder isn't empty
            if (err.errno==-66) {
              // ls our folder
              nodefs.readdir(folderName, function(err, files) {
                if (!err) {
                  files.forEach(function (file, index) {
                    var curPath = folderName + "/" + file;
                    nodefs.stat(curPath, function(err, stat) {
                      if (stat.isDirectory()) {
                        // it's a directory - recurse
                        console.log(folderName + ", " + curPath);
                        messy.fs.rmdir(curPath);
                      } else { 
                        // it's a file - delete it
                        nodefs.unlink(curPath);
                      }
                    })
                  });
                  nodefs.rmdir(folderName, function() {
                    callback(err, {rmdir: folderName})
                  });
                } else {
                  // something really bad happened doing readdir, so let's fail out
                  console.log('something bad happened doing readdir in messy.fs.rmdir');
                  callback(err, null);
                }
              })
            } else {
              console.log('some other error happened, let the callback function handle it');
              callback(err, null);
            }
          }
        })
*/
/**
 * This script removes regenerator bundled with babel-runtime
 */
var fs = require('fs');
try {
  var index = require.resolve('babel-runtime/regenerator/index.js');
  var runtime = require.resolve(
    'babel-runtime/regenerator/runtime.js');
  if (index) {
    fs.unlink(index, function(err) {
      if (err) console.error(err);
      if (runtime) fs.unlink(runtime, function(err) {
        if (err) console.error(err);
      }); ;
    });
  }
} catch (err) {
  // Ignore
}

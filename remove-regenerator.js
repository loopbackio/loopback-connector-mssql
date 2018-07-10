// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-connector-mssql
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

/**
 * This script removes regenerator bundled with babel-runtime
 */
'use strict';
var fs = require('fs');
try {
  var index = require.resolve('babel-runtime/regenerator/index.js');
  var runtime = require.resolve(
    'babel-runtime/regenerator/runtime.js'
  );
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

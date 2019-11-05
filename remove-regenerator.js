// Copyright IBM Corp. 2016,2018. All Rights Reserved.
// Node module: loopback-connector-mssql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * This script removes regenerator bundled with babel-runtime
 */
'use strict';
const fs = require('fs');
try {
  const index = require.resolve('babel-runtime/regenerator/index.js');
  const runtime = require.resolve(
    'babel-runtime/regenerator/runtime.js',
  );
  if (index) {
    fs.unlink(index, function(err) {
      if (err) console.error(err);
      if (runtime) fs.unlink(runtime, function(err) {
        if (err) console.error(err);
      });
    });
  }
} catch (err) {
  // Ignore
}

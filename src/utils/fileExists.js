// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Simple helper to check file existence
 * (could also work for directories..)
 ***************************************************/

const fs = require('fs');

module.exports = function (path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};



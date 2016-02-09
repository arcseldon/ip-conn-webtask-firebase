// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Reads config mapping file of the form:
 *
 * 83.29.4.2/16, fabrikam-adfs
 * 99.2.4.28/32, contoso-ping
 * 44.2.4.3/16, ms-azuread
 * 200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40, fabrikam-adfs-6
 * 60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40, contoso-ping-6
 * eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64, ms-azuread-6
 *
 * Handles basic validation of input
 *
 ***************************************************/


const fs = require('fs'),
  assert = require('assert'),
  ipUtils = require('ipaddr.js'),
  R = require('ramda');

module.exports = R.curry((filePath, cb) => {

  const TUPLE_SEPARATOR = ',';

  const isNotEmpty = function (line) {
    return line.trim().length !== 0;
  };

  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      return cb(err);
    }
    try {
      const lines = R.filter(isNotEmpty, data.split('\n'));
      const strEq = R.eqBy(String);
      const uniqueLines = R.uniqWith(strEq)(lines);
      const mapIndexed = R.addIndex(R.map);
      const mappings = mapIndexed((line, i) => {
        try {
          const parts = line.split(TUPLE_SEPARATOR);
          assert(parts.length === 2, 'Invalid line detected');
          const cidr = parts[0].trim();
          assert(!/\s/g.test(cidr), 'Illegal spacing in CIDR');
          const connection = parts[1].trim();
          assert(!/\s/g.test(connection), 'Illegal spacing in connection name');
          assert(ipUtils.isValid(cidr.split('/')[0]), 'Invalid IP');
          return {cidr, connection};
        } catch (e) {
          cb(`File parse error at or near line ${i}: ${e.message}`);
        }
      }, uniqueLines);
      const partitionByIpType = R.partition(function (item) {
        const ip = item.cidr.split('/')[0];
        return ipUtils.parse(ip).kind() === 'ipv4';
      });
      return cb(null, partitionByIpType(mappings));
    } catch (e) {
      return cb(e.message);
    }
  });

});

// author arcseldon@icloud.com
'use strict';

/***************************************************
 *
 * In IPv4, each octet consists of a decimal number ranging from 0 to 255.
 * These numbers are typically separated by periods.
 * In IPv6, addresses are expressed as a series of eight 4-character hexadecimal numbers,
 * which represent 16 bits each (for a total of 128 bits).
 *
 * The idea is to group IPv4 addresses by first 8, 16 or 24 bits - depending on Client CIDR reqs.
 * The idea is to group IPv6 addresses by first 16, 32, 48 bits - depending on Client CIDR reqs.
 *
 * This will result in more performant lookup and reduce payload size over network when fetching
 * IP to Connection mappings - assuming here for example we are using an API service such as Firebase
 * to host our mappings data
 *
 * Clients should tailor the groupedBy size according their own needs, typically taking lowest
 * possible value for each IP type.
 *
 ***************************************************/

const R = require('ramda');

const ipv4SplitBy = {

  by8Bits: function (ipConn) {
    return ipConn.cidr.split('.')[0];
  },

  by16Bits: function (ipConn) {
    return [ipConn.cidr.split('.')[0], ipConn.cidr.split('.')[1]].join(':');
  },

  by24Bits: function (ipConn) {
    return [ipConn.cidr.split('.')[0],
      ipConn.cidr.split('.')[1],
      ipConn.cidr.split('.')[2]].join(':');
  }

};

const ipv4GroupBy = {

  by8Bits: R.groupBy(ipv4SplitBy.by8Bits),

  by16Bits: R.groupBy(ipv4SplitBy.by16Bits),

  by24Bits: R.groupBy(ipv4SplitBy.by24Bits)

};

const ipv6SplitBy = {

  by16Bits: function (ipConn) {
    return ipConn.cidr.split(':')[0];
  },

  by32Bits: function (ipConn) {
    return [ipConn.cidr.split(':')[0], ipConn.cidr.split(':')[1]].join(':');
  },

  by48Bits: function (ipConn) {
    return [ipConn.cidr.split(':')[0],
      ipConn.cidr.split(':')[1],
      ipConn.cidr.split(':')[2]].join(':');
  }

};

const ipv6GroupBy = {

  by16Bits: R.groupBy(ipv6SplitBy.by16Bits),

  by32Bits: R.groupBy(ipv6SplitBy.by32Bits),

  by48Bits: R.groupBy(ipv6SplitBy.by48Bits)

};

module.exports = {
  ipv4SplitBy,
  ipv4GroupBy,
  ipv6SplitBy,
  ipv6GroupBy
};

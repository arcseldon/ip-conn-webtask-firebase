// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Sets up necessary NetMask and GroupBy Function
 * to work with given IP type and GroupBy size
 *
 * This is the "meta" information needed to allow
 * our apps to behave polymorphically with regards
 * to IP Type and GroupBy size variations
 *
 * Consider this information a blackboxed strategy
 * pattern - depends on groupByUtils
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


const groupByUtils = require('./groupByUtils'),
  ipv4GroupBy = groupByUtils.ipv4GroupBy,
  ipv6GroupBy = groupByUtils.ipv6GroupBy;

const ipv4Meta = (groupBy) => {

  const meta = {};

  switch (groupBy) {
    case 'none':
      meta.ipv4NetMasks = [8, 16, 24, 32];
      meta.ipv4GroupedByFn = ipv4GroupBy.by8Bits;
      break;
    case 'by8Bits':
      meta.ipv4NetMasks = [8, 16, 24, 32];
      meta.ipv4GroupedByFn = ipv4GroupBy.by8Bits;
      break;
    case 'by16Bits':
      meta.ipv4NetMasks = [16, 24, 32];
      meta.ipv4GroupedByFn = ipv4GroupBy.by16Bits;
      break;
    case 'by24Bits':
      meta.ipv4NetMasks = [24, 32];
      meta.ipv4GroupedByFn = ipv4GroupBy.by24Bits;
      break;
    default:
      throw Error(`Unrecognised ipv4GroupBy param: ${ipv4GroupBy}`);
  }
  return meta;

};

const ipv6Meta = (groupBy) => {

  const meta = {};

  switch (groupBy) {
    case 'none':
      meta.ipv6NetMasks = [16, 32, 48, 64];
      meta.ipv6GroupedByFn = ipv6GroupBy.by16Bits;
      break;
    case 'by16Bits':
      meta.ipv6NetMasks = [16, 32, 48, 64];
      meta.ipv6GroupedByFn = ipv6GroupBy.by16Bits;
      break;
    case 'by32Bits':
      meta.ipv6NetMasks = [32, 48, 64];
      meta.ipv6GroupedByFn = ipv6GroupBy.by32Bits;
      break;
    case 'by48Bits':
      meta.ipv6NetMasks = [48, 64];
      meta.ipv6GroupedByFn = ipv6GroupBy.by48Bits;
      break;
    default:
      throw Error(`Unrecognised ipv6GroupBy param: ${ipv6GroupBy}`);
  }
  return meta;

};

module.exports = {
  ipv4Meta,
  ipv6Meta
};


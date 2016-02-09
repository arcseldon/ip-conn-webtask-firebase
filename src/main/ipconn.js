// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Webtask expects to receive requests containing IP
 * address request param. Does a lookup for a matching
 * connection based on IP against Firebase hosted &
 * optimised IP to Connection mapping.
 *
 * The fact that webtask must be self-contained, and
 * not depend on helper custom modules is one reason
 * this webtask is slightly procedural and contains
 * more lines of code than a typical module
 ***************************************************/

const Firebase = require('firebase'),
  ipUtils = require('ipaddr.js'),
  R = require('ramda');

const getConfig = (rawConfig) => {
    return rawConfig.map((item) => {
      return {
        cidr: ipUtils.parseCIDR(item.cidr),
        connection: {connection: item.connection}
      };
    });
  },

  unknownConn = {connection: 'unknown'},

  getConn = (config, ip) => {
    const matchIndex = R.findIndex((cidrConn) => {
      return ip.match(cidrConn.cidr);
    })(config);
    return (matchIndex !== -1) ? config[matchIndex].connection : unknownConn;
  },

  ipv4SplitBy = {
    by8Bits: function (ip) {
      return ip.split('.')[0];
    },
    by16Bits: function (ip) {
      return [ip.split('.')[0], ip.split('.')[1]].join(':');
    },
    by24Bits: function (ip) {
      return [ip.split('.')[0],
        ip.split('.')[1],
        ip.split('.')[2]].join(':');
    }
  },

  ipv6SplitBy = {
    by16Bits: function (ip) {
      return ip.split(':')[0];
    },
    by32Bits: function (ip) {
      return [ip.split(':')[0], ip.split(':')[1]].join(':');
    },
    by48Bits: function (ip) {
      return [ip.split(':')[0],
        ip.split(':')[1],
        ip.split(':')[2]].join(':');
    }
  };


module.exports = function (ctx, done) {

  const FIREBASE = ctx.data.FIREBASE;

  /***************************************************
   * Set up firebase params based on secret FIREBASE key
   ***************************************************/

  if (!FIREBASE) {
    return done(Error('FIREBASE is required'));
  }
  if (FIREBASE.split('|').length !== 4) {
    return done(Error('FIREBASE format is incorrect. Use <endpoint>\|<secret>\|<ipv4GroupBy>\|<ipv6GroupBy>'));
  }

  let endpoint = FIREBASE.split('|')[0];
  const secret = FIREBASE.split('|')[1];
  const ipv4GroupBy = FIREBASE.split('|')[2];
  const ipv6GroupBy = FIREBASE.split('|')[3];

  /***************************************************
   * validate group by inputs
   ***************************************************/

  const ipv4GroupByWhiteList = R.concat(Object.keys(ipv4SplitBy), 'none');

  if (!R.contains(ipv4GroupBy, ipv4GroupByWhiteList)) {
    return done(`Error: invalid ipv4GroupBy. Valid options: ${ipv4GroupByWhiteList}`);
  }

  const ipv6GroupByWhiteList = R.concat(Object.keys(ipv6SplitBy), 'none');

  if (!R.contains(ipv6GroupBy, ipv6GroupByWhiteList)) {
    return done(`Error: invalid ipv6GroupBy. Valid options: ${ipv6GroupByWhiteList}`);
  }

  /***************************************************
   * validate IP param
   ***************************************************/

  const ipParam = ctx.data.ip;

  //validate if IPv4 or IPv6 address
  if (!ipUtils.isValid(ipParam)) {
    console.error(`Invalid ip parameter: ${ipParam}`);
    return done('Error: invalid ip parameter');
  }

  const ip = ipUtils.parse(ipParam);

  console.log(`IP Address: ${ip}\n`);

  /***************************************************
   * determine correct URL to call based
   * on IP type and groupby
   ***************************************************/

  switch (ip.kind()) {
    case 'ipv4':
      endpoint = (ipv4GroupBy !== 'none') ?
        `${endpoint}/ipv4/${ipv4SplitBy[ipv4GroupBy](ipParam)}` :
        `${endpoint}/ipv4/`;
      break;
    case 'ipv6':
      endpoint = (ipv6GroupBy !== 'none') ?
        `${endpoint}/ipv6/${ipv6SplitBy[ipv6GroupBy](ipParam)}` :
        `${endpoint}/ipv6/`;
      break;
    default:
      console.error('Unrecognised ip type');
      return done({error: 'Service unavailable'});
  }

  console.log(`Derived endpoint: ${endpoint}\n`);

  /***************************************************
   * Hand over to firebase
   ***************************************************/

  let firebase;
  try {
    firebase = new Firebase(endpoint);
  } catch (e) {
    console.error(e);
    return done({error: 'Firebase connection error, check endpoint'});
  }

  firebase.authWithCustomToken(secret, function (error) {
    if (error) {
      console.error(error);
      return done({error: 'Service unavailable'});
    }
  });

  /***************************************************
   * asynchronously await for a 'value' event
   * then use the config returned to lookup IP
   ***************************************************/

  firebase.on('value', function (config) {
    try {
      const rawConfig = config.val();
      if (!rawConfig) {
        return done(null, unknownConn);
      }
      const parsedConfig = getConfig(rawConfig);
      return done(null, getConn(parsedConfig, ip));
    } catch (error) {
      console.error(`Failed to parse config: ${error}`);
      return done({error: 'Service unavailable'});
    }
  }, function (error) {
    console.error(`Error: ${error.code}`);
    return done({error: 'Service unavailable'});
  });

};

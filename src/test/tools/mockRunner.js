// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Mock Configuration Generator.
 * -----------------------------
 *
 * Creates random data sets of ipv4 and ipv6 to connection mappings
 *
 * Can specify the number of mappings of each IP Type, and what groupBy
 * size in bits for both ipv4 and ipv6
 *
 * Output data shape (example uses ipv4 groupBy size 16 bits, and ipv6 groupBy size 32 bits):
 *
 * {
 *   'ipv4': {
 *     '89.213': [
 *       {
 *         'cidr': '89.213.165.56\/32',
 *         'connection': 'wegwomatuubi'
 *       }
 *     ]
 *   },
 *   'ipv6': {
 *     '4b94.7ce3': [
 *       {
 *         'cidr': '4b94:7ce3:437b:f56d:8077:e2d2:3ef4:8afd\/48',
 *         'connection': 'uvguncuterii'
 *       },
 *       {
 *         'cidr': '4b94:7ce3:abcd:f56d:8999:e2d2:3ef4:8afd\/48',
 *         'connection': 'avgutvierii'
 *       }
 *     ]
 *   }
 * }
 *
 ***************************************************/

const fs = require('fs'),
  R = require('ramda'),
  ipUtils = require('ipaddr.js'),
  Chance = require('chance'),
  chance = new Chance(),
  program = require('commander'),
  groupByMeta = require('../../utils/groupByMeta'),
  data_groupby_none = require('../fixtures/group-by-none'),
  ipv4TestFixturesData = data_groupby_none.ipv4,
  ipv6TestFixturesData = data_groupby_none.ipv6,
  version = require('../../../package.json').version;

/***************************************************
 * Default approx. mock data size
 *
 * The --testfixtures command line option appends
 * testcase fixtures so actual size may vary
 * If random duplicates are created, these are
 * filterd out so actual size may vary
 ***************************************************/

let count = 1000;
const COUNT_MAX = 10000;

const ipv4GroupByRegex = /^(none|by8Bits|by16Bits|by24Bits)$/;
const ipv6GroupByRegex = /^(none|by16Bits|by32Bits|by48Bits)$/;

const OUTPUT_FILE = `${__dirname}/output/mockConfigMap.json`;

program
  .version(version)
  .option('-c, --count <n>', `Number of each ip type to create, default ${count}`, parseInt)
  .option('-g --ipv4GroupBy [ipv4GroupBy]', 'ipv4GroupBy', ipv4GroupByRegex)
  .option('-g --ipv6GroupBy [ipv6GroupBy]', 'ipv6GroupBy', ipv6GroupByRegex)
  .option('-t, --testfixtures', 'Add test fixtures in addition to requested data set');

program.on('--help', function () {
  console.log('  Generates mock ipv4 and ipv6 data, optionally groupedBy bit count you want');
  console.log(`  Count limit is ${COUNT_MAX}`);
  console.log(`  Output is written to: ${OUTPUT_FILE}`);
  console.log('');
});

program.parse(process.argv);

count = program.count && Math.abs(program.count) || count;

const handleViolation = (msg) => {
  console.error(msg);
  process.exit(1);
};

// lets set a reasonable limit on count
if (count > COUNT_MAX) {
  handleViolation(`Count limit exceeded. Use --help for further info`);
}
// needed because Commander regex option fails...
if (!ipv4GroupByRegex.test(program.ipv4GroupBy)) {
  handleViolation('--ipv4GroupBy is required. Use --help for further info');
}
if (!ipv6GroupByRegex.test(program.ipv6GroupBy)) {
  handleViolation('--ipv6GroupBy is required. Use --help for further info');
}

const testFixtures = !!program.testfixtures;
const ipv4GroupBy = program.ipv4GroupBy;
const ipv6GroupBy = program.ipv6GroupBy;
const ipv4Meta = groupByMeta.ipv4Meta(ipv4GroupBy);
const ipv6Meta = groupByMeta.ipv6Meta(ipv6GroupBy);

const randomIndex = (n) => {
  return Math.floor(Math.random() * n);
};

/***************************************************
 * Generates UNIQUE CIDR entries so we avoid overlapping
 * matches. Memoizes previous results, and recursively
 * compares new entry against previous entries
 ***************************************************/

const createIpConn = R.curry((ipFactory, netMasks) => {
  const cidrs = [];
  const alreadyMatched = R.compose(R.not, R.isNil, R.find((cidr) => ip.match(cidr)));
  const getUnmatched = () => {
    let ip = ipUtils.parse(ipFactory());
    return (alreadyMatched(ip)) ? getUnmatched() : ip;
  };
  return function (_) {
    const cidr = getUnmatched() + '/' + netMasks[randomIndex(netMasks.length)];
    cidrs.push(cidr);
    return {
      cidr: cidr,
      connection: chance.word({length: 12})
    };
  };
});

const generateIpv4s = R.compose(R.map(createIpConn(chance.ip.bind(chance), ipv4Meta.ipv4NetMasks)), R.range(0));
const generateIpv6s = R.compose(R.map(createIpConn(chance.ipv6.bind(chance), ipv6Meta.ipv6NetMasks)), R.range(0));
const filterDuplicates = R.uniqBy(R.prop('cidr'));

const baseIpv4Config = R.compose(filterDuplicates, generateIpv4s);
const baseIpv6Config = R.compose(filterDuplicates, generateIpv6s);
const baseIpv4ConfigWithTestFixtures = R.compose(R.concat(ipv4TestFixturesData), baseIpv4Config);
const baseIpv6ConfigWithTestFixtures = R.compose(R.concat(ipv6TestFixturesData), baseIpv6Config);

const root = {};

if (ipv4GroupBy === 'none') {
  root.ipv4 = (testFixtures) ?
    baseIpv4ConfigWithTestFixtures(count) :
    baseIpv4Config(count);
} else {
  root.ipv4 = (testFixtures) ?
    R.compose(ipv4Meta.ipv4GroupedByFn, baseIpv4ConfigWithTestFixtures)(count) :
    R.compose(ipv4Meta.ipv4GroupedByFn, baseIpv4Config)(count);
}

if (ipv6GroupBy === 'none') {
  root.ipv6 = (testFixtures) ?
    R.compose(R.concat(ipv6TestFixturesData), baseIpv6Config)(count) :
    baseIpv6Config(count)
} else {
  root.ipv6 = (testFixtures) ?
    R.compose(ipv6Meta.ipv6GroupedByFn, baseIpv6ConfigWithTestFixtures)(count) :
    R.compose(ipv6Meta.ipv6GroupedByFn, baseIpv6Config)(count)
}

fs.writeFile(OUTPUT_FILE, JSON.stringify(root), (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`Test data saved to file: ${OUTPUT_FILE}`);
});

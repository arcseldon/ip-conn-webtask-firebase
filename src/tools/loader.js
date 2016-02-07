// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Create wt-cli command for given input csv mappings
 * Deploy automatically
 ***************************************************/

const fs = require('fs'),
  program = require('commander'),
  dotenv = require('dotenv'),
  R = require('ramda'),
  async = require('async'),
  waterfall = async.waterfall,
  groupByMeta = require('../utils/groupByMeta'),
  firebaseSetter = require('../utils/firebaseSetter'),
  configMapReader = require('../utils/configMapReader'),
  fileExists = require('../utils/fileExists'),
  version = require('../../package.json').version;

dotenv.load();

const INPUT_FILE = `${__dirname}/config.csv`;
const SAMPLE_FILE = `${__dirname}/sample.csv`;
const OUTPUT_FILE = `${__dirname}/output/configMap.json`;

const ipv4GroupByRegex = /^(none|by8bits|by16bits|by24bits)$/;
const ipv6GroupByRegex = /^(none|by16bits|by32bits|by48bits)$/;

program
  .version(version)
  .option('-g --ipv4GroupBy [ipv4GroupBy]', 'ipv4GroupBy', ipv4GroupByRegex)
  .option('-g --ipv6GroupBy [ipv6GroupBy]', 'ipv6GroupBy', ipv6GroupByRegex)
  .option('-d --deploy', 'Do config deployment to firebase');

program.on('--help', function () {
  console.log('  Converts simple csv file with CIDR, Connection pairs into firebase config');
  console.log('  Example with options: --ipv4GroupBy by16bits --ipv6GroupBy by48bits --deploy');
  console.log('  Will group the ipv4 cidrs by first 16 bits and ipv6 cidrs by first 48 bits');
  console.log('  The --deploy will autodeploy the configuraiton to your firebase app');
  console.log(`  Input file should be named mapping.csv, located at: ${INPUT_FILE}.`);
  console.log('  Format, once per line:  cidr, connection_name');
  console.log('  Example line:  83.29.4.2/16, fabrikam-adfs');
  console.log(`  For an example input file, see: ${SAMPLE_FILE}`);
  console.log(`  Configuration output is written to: ${OUTPUT_FILE}`);
  console.log('');
});

program.parse(process.argv);

const deploy = program.deploy || false;

const handleViolation = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!fileExists(INPUT_FILE)) {
  handleViolation(`Configuration file containing mappings must be provided at: ${INPUT_FILE}`);
}

// needed because Commander regex option fails...
if (!program.ipv4GroupBy || !ipv4GroupByRegex.test(program.ipv4GroupBy)) {
  handleViolation('--ipv4GroupBy is required. Use --help for further info');
}
if (!program.ipv6GroupBy || !ipv6GroupByRegex.test(program.ipv6GroupBy)) {
  handleViolation('--ipv6GroupBy is required. Use --help for further info');
}

const createMapping = (mappings, cb) => {

  const baseIpv4Config = mappings[0];
  const baseIpv6Config = mappings[1];
  const root = {};
  const ipv4GroupBy = program.ipv4GroupBy;
  const ipv6GroupBy = program.ipv6GroupBy;
  const ipv4Meta = groupByMeta.ipv4Meta(ipv4GroupBy);
  const ipv6Meta = groupByMeta.ipv6Meta(ipv6GroupBy);

  root.ipv4 = (ipv4GroupBy === 'none') ?
    baseIpv4Config :
    ipv4Meta.ipv4GroupedByFn(baseIpv4Config);

  root.ipv6 = (ipv6GroupBy === 'none') ?
    baseIpv6Config :
    root.ipv6 = ipv6Meta.ipv6GroupedByFn(baseIpv6Config);

  cb(null, root);

};

const writeMapping = R.curry((outputFile, root, cb) => {
  fs.writeFile(outputFile, JSON.stringify(root), (err) => {
    if (err) {
      return cb(err);
    }
    console.log(`Test data saved to file: ${outputFile}`);
    cb(null, root);
  });
});

const deployToFirebase = (root, cb) => {
  if (!deploy) {
    return cb();
  }
  /*eslint-disable*/
  const FIREBASE_URL = process.env.FIREBASE_URL;
  const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN;
  /*eslint-enable*/
  console.log('Deploying configuratino to Firebase, please be patient...');
  return firebaseSetter(FIREBASE_URL, FIREBASE_TOKEN, root, cb);
};

const completed = (err) => {
  if (err) {
    console.error(err);
    return process.exit(1);
  }
  console.log(`Application completed successfully`);
  process.exit(0);
};

// kick off async tasks
waterfall([
  configMapReader(INPUT_FILE),
  createMapping,
  writeMapping(OUTPUT_FILE),
  deployToFirebase
], completed);

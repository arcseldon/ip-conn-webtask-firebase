// author arcseldon@icloud.com
'use strict';
/*eslint no-unused-expressions:0*/

/***************************************************
 * Demonstration test cases using full Firebase
 * setup (connecting to Firebase and loading test data
 * Acts more as  functional smoke tests
 ***************************************************/

const R = require('ramda'),
  chai = require('chai'),
  expect = chai.expect,
  dotenv = require('dotenv'),
  firebaseSetter = require('../../utils/firebaseSetter'),
  webtask = require('../../main/ipconn'),
  data_groupby_16_32 = require('../fixtures/group-by-ipv4_16-ipv6_32'),
  data_groupby_24_48 = require('../fixtures/group-by-ipv4_24-ipv6_48'),
  data_groupby_none = require('../fixtures/group-by-none'),
  ipv4TestData = data_groupby_none.ipv4,
  ipv6TestData = data_groupby_none.ipv6;

dotenv.load();

describe('ip-conn testcases', () => {

  const configs = [data_groupby_none, data_groupby_16_32, data_groupby_24_48];
  const groupBySizes = ['none|none', 'by16Bits|by32Bits', 'by24Bits|by48Bits'];

  const randomIndex = (n) => {
    return Math.floor(Math.random() * n);
  };

  // load the environment variables (see .env)
  const FIREBASE_OVERWRITE = /true/i.test(process.env.FIREBASE_OVERWRITE);
  const FIREBASE_URL = process.env.FIREBASE_URL;
  const FIREBASE_TOKEN = process.env.FIREBASE_TOKEN;

  const groupByIndex = randomIndex(3);

  const ctx = {data: {ip: ''}};

  ctx.data.FIREBASE = `${FIREBASE_URL}|${FIREBASE_TOKEN}|${groupBySizes[groupByIndex]}`;

  if (FIREBASE_OVERWRITE) {
    // print out which random group by sizes for IPv4 and IPv6 CIDRs we are using on this test run
    const banner = R.compose(R.join(' '), R.map(R.join(': ')), R.zip(['IPv4', 'IPv6']), R.split('|'));
    console.log(`\nOVERWRITING FIREBASE DATA\n`);
    console.log(`\nRUNNING TEST CASES WITH CONFIG GROUPED BY: ${banner(groupBySizes[groupByIndex])}\n`);
  }

  before(function (done) {
    this.timeout(60000);
    const config = configs[groupByIndex];
    // go ahead and populate FireBase with test data
    if(!FIREBASE_OVERWRITE) {
      return done();
    }
    return firebaseSetter(FIREBASE_URL, FIREBASE_TOKEN, config, done);
  });

  describe('invalid ip input', function () {

    let lctx;

    beforeEach((done) => {
      lctx = {data: {ip: ''}};
      lctx.data.FIREBASE = Object.assign(ctx.data.FIREBASE);
      done();
    });

    it('should reject missing ip', (done) => {
      delete lctx.data.ip;
      webtask(lctx, function (err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done();
      });
    });

    it('should reject any ip not adhering to IPv4 or IPv6 format', (done) => {
      // bear in mind we don't wish to retest third party lib so light test
      let invalid = [];
      /* eslint-disable */
      invalid.push('1111.222.333.444');  // incorrect format
      invalid.push('');  // empty
      invalid.push('adlskfjadkfj');  // incorrect text
      /* eslint-enable */
      invalid.forEach(function (ip) {
        lctx.data.ip = ip;
        webtask(lctx, function (err, data) {
          expect(err).to.exist;
          expect(data).to.not.exist;
        });
      });
      done();
    });

  });

  describe('no matching connections', function () {

    this.timeout(8000);

    let lctx;

    beforeEach((done) => {
      lctx = {data: {ip: ''}};
      lctx.data.FIREBASE = Object.assign(ctx.data.FIREBASE);
      done();
    });

    const callbackWith = (done) => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(err).to.not.exist;
        expect(data.connection).to.equal('unknown');
        done();
      };
    };

    it('should treat non-existent ipv6 as unknown connection', (done) => {
      lctx.data.ip = '2001:cdba::3257:9652';
      webtask(lctx, callbackWith(done));
    });

    it('should treat non-existent ipv4 as unknown connection', (done) => {
      lctx.data.ip = '83.35.4.6';
      webtask(lctx, callbackWith(done));
    });
  });


  describe('incorrect firebase configuration settings', function () {

    this.timeout(8000);

    let lctx;

    beforeEach((done) => {
      lctx = {data: {ip: ''}};
      lctx.data.FIREBASE = Object.assign(ctx.data.FIREBASE);
      done();
    });

    it('should fail with incorrect FIREBASE configuration', (done) => {
      lctx.data.ip = '83.29.4.6';
      delete lctx.data.FIREBASE;
      webtask(lctx, function (err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done();
      });
    });

    it('should fail with incorrect firebase endpoint configuration', (done) => {
      lctx.data.ip = '83.29.4.6';
      const secret = lctx.data.FIREBASE.split('|')[1];
      lctx.data.FIREBASE = 'https://asdfm|' + secret;
      webtask(lctx, function (err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done()
      });
    });

    it('should fail with incorrect firebase secret configuration', (done) => {
      lctx.data.ip = '83.29.4.6';
      const endpoint = lctx.data.FIREBASE.split('|')[0];
      lctx.data.FIREBASE = endpoint + '|asdfadsf';
      webtask(lctx, function (err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done();
      });
    });

  });

  describe('matching connections with ipv4 and ipv6 addresses', function () {

    this.timeout(10000);

    const successCallbackWith = (name, done) => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(data).to.exist;
        console.log('Have data connection: ', data.connection);
        expect(data.connection).to.equal(name);
        done();
      };
    };

    // Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs
    it('should match with fabrikam-adfs', (done) => {
      ctx.data.ip = '83.29.4.6';
      webtask(ctx, successCallbackWith(ipv4TestData[0].connection, done));
    });

    // Contoso => 99.2.4.28/32 => Connection: contoso-ping
    it('should match with contoso-ping', (done) => {
      ctx.data.ip = '99.2.4.28';
      webtask(ctx, successCallbackWith(ipv4TestData[1].connection, done));
    });

    // Microsoft => 44.2.4.3/16 => Connection: ms-azuread
    it('should match with ms-azuread', (done) => {
      ctx.data.ip = '44.2.4.3';
      webtask(ctx, successCallbackWith(ipv4TestData[2].connection, done));
    });

    // Fabrikam => 200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40 => Connection: fabrikam-adfs-6
    it('should match with fabrikam-adfs-6', (done) => {
      ctx.data.ip = '200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa';
      webtask(ctx, successCallbackWith(ipv6TestData[0].connection, done));
    });

    // Contoso => 60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40 => Connection: contoso-ping-6
    it('should match with contoso-ping-6', (done) => {
      ctx.data.ip = '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6';
      webtask(ctx, successCallbackWith(ipv6TestData[1].connection, done));
    });

    // Microsoft => eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64 => Connection: ms-azuread-6
    it('should match with ms-azuread-6', (done) => {
      ctx.data.ip = 'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29';
      webtask(ctx, successCallbackWith(ipv6TestData[2].connection, done));
    });

  });

});

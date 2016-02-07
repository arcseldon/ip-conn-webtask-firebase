// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Lightweight tests to gain familiarity with ipaddr.js
 * NPM module, and confirm understanding of its API
 ***************************************************/

/*eslint no-unused-expressions:0*/

const chai = require('chai'),
  expect = chai.expect,
  ipUtils = require('ipaddr.js');

// light smoke test to understand api and gain confidence about any edgecase

describe('ipaddr.js third party module - usage patterns for validate, parse, and match', () => {


  it('should validate, parse and match', () => {

    const invalidIp = '192.168.1.257';
    expect(ipUtils.isValid(invalidIp)).to.be.false;

    const validIp = '192.168.1.1';
    expect(ipUtils.isValid(validIp)).to.be.true;

    const addr1 = ipUtils.parse('83.29.4.6');
    expect(addr1.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.true;

    const addr2 = ipUtils.parse('83.29.16.6');
    expect(addr2.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.true;

    const addr3 = ipUtils.parse('83.30.4.6');
    expect(addr3.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.false;

    // try matching ipv4 address against an ipv6 CIDR.. throws Exception !!!
    const addr4 = ipUtils.parse('83.30.4.6');
    expect(function () {
      addr4.match(ipUtils.parseCIDR('200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40'));
    }).to.throw;
  });

});


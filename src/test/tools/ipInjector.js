// author arcseldon@icloud.com
'use strict';

/***************************************************
 * TEST SCRIPT ONLY - USEFUL FOR DEMOS / QUICK TESTING
 *
 * Simple script for injecting own IP address into
 * sample.csv file, helpful for testing, especially
 * if IP address changes frequently, perhaps using
 * VPN software to different regions etc
 *
 * In .env (in base of project), add something like this:
 *
 * AUTH0_DOMAIN=https://arcseldon.au.auth0.com/user/ip
 * AUTH0_CONNECTION=twitter
 *
 * Just use the connection you have setup for your domain,
 * and wish to auto-login with using your current IP
 *
 ***************************************************/

const fs = require('fs'),
  assert = require('assert'),
  request = require('request'),
  ipUtils = require('ipaddr.js'),
  dotenv = require('dotenv');

dotenv.load();

const SAMPLE_FILE = `${__dirname}/../../tools/sample.csv`;
const AUTH0_DOMAIN_URL = process.env.AUTH0_DOMAIN_URL;
const AUTH0_CONNECTION = process.env.AUTH0_CONNECTION;

//console.log(SAMPLE_FILE);
//console.log(AUTH0_DOMAIN_URL);
//console.log(AUTH0_CONNECTION);

const options = {
  url: AUTH0_DOMAIN_URL,
  headers: {
    'User-Agent': 'request'
  }
};

const ipv4Type = (ip) => ip.kind() === 'ipv4';

const callback = function (error, response, body) {
  if (!error && response.statusCode == 200) {
    const ipInfo = JSON.parse(body);
    assert(ipInfo.ip, 'Expected IP in response');
    const ip = ipUtils.parse(ipInfo.ip);
    console.log(`IP Address: "${ip}"\n`);
    const mask = ipv4Type(ip) ? 32 : 128;
    const entry = `${ipInfo.ip}/${mask},${AUTH0_CONNECTION}\n`;
    fs.appendFile(SAMPLE_FILE, entry, function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log('Injected own IP, connection info');
      process.exit(0);
    });
  }
};

request(options, callback);

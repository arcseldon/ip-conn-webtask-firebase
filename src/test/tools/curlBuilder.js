// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Hack only - it will parse the logs contained in
 * projectbase/.tmp/out
 *
 * and build necessary CURL command to test webtask
 * deployment. This is a tail-end script for ./demo.sh
 *
 ***************************************************/


const fs = require('fs'),
  exec = require('child_process').exec;


const getUrl = (lines) => {
  const lineWithUrl = lines.filter((line) => {
    return /^URL:/.test(line);
  })[0];
  const regex = /^URL: "(.*)"/;
  const url = regex.exec(lineWithUrl)[1];
  return url;
};

const getIp = (lines) => {
  const lineWithIp = lines.filter((line) => {
    return /^IP Address:/.test(line);
  })[0];
  const regex = /^IP Address: "(.*)"/;
  const ip = regex.exec(lineWithIp)[1];
  return ip;
};

const filePath = `${__dirname}/../../../.tmp/out`;

fs.readFile(filePath, 'utf8', function (err, data) {
  if (err) {
    return console.error(err);
  }
  //console.log(data);
  const lines = data.split('\n');
  const url = getUrl(lines);
  //console.log(url);
  const ip = getIp(lines);
  //console.log(ip);

  //const `IP Address:
  const curlCmd = `curl ${url}?ip=${ip}`;
  console.log(curlCmd);

  exec(curlCmd, function (err, stdout, stderr) {
    if (stdout) {
      console.log(`\nWebtask Response: ${stdout}\n`);
    }
    //if (stderr) {
    //  console.log('stderr: ' + stderr);
    //}
    if (err) {
      console.error('exec error: ' + err);
    }
  });

});

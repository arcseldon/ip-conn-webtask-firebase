// author arcseldon@icloud.com
'use strict';

const Firebase = require('firebase');

/***************************************************
 * Sets up firebase connection with authentication
 * and overwrites firebase dataset with config provided
 ***************************************************/

module.exports = function (endpoint, secret, config, done) {

  let firebase;

  try {
    firebase = new Firebase(endpoint);
  } catch (e) {
    console.error(e);
    return done(e);
  }

  firebase.authWithCustomToken(secret, (err) => {
    if (err) {
      console.error(err);
      return done(err);
    }
    firebase.set(config, (e) => {
      if (e) {
        return done(e);
      }
      return done();
    });
  });

};

/* globals console */
/* eslint no-console: 0 */

const { bundle } = require('../..');
const { createStore } = require('redux');
const root = require('./nodes');

const printState = (message, store) => {
  console.log('--------------------------------------------------------------');
  console.log(message);
  console.log('--------------------------------------------------------------');
  console.log(JSON.stringify(store.getState(), null, 2));
  console.log();
};

const app = bundle(root);
const store = createStore(app.reducer);
const actions = app.getActions(store);

printState('Initial state', store);

actions.auth.login('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
actions.devices.getDevices();
printState('Some data received', store);

actions.auth.logout();
printState('User signed out', store);

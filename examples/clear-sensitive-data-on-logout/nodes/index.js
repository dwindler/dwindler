const auth = require('./auth');
const devices = require('./devices');

// Create store
const root = {
  children: {
    auth,
    devices
  }
};

module.exports = root;

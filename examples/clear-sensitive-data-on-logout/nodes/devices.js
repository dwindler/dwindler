const { composeDeclarations } = require('../../..');
const sensitiveData = require('./partials/sensitiveData');

module.exports = composeDeclarations(
  // The device list is reverted back to initial state when user logs out
  sensitiveData({
    list: []
  }),

  {
    actions: {
      getDevices() {
        this.dispatch('receivedDevices', [
          { id: 1, name: 'Temperature sensor' },
          { id: 2, name: 'Pressure sensor' },
          { id: 3, name: 'Motion detector' }
        ]);
      }
    },

    reducers: {
      receivedDevices: (state, devices) => ({ ...state, list: devices })
    }
  }
);

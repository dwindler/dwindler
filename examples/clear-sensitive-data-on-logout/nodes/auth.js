const { composeDeclarations } = require('../../..');
const sensitiveData = require('./partials/sensitiveData');

module.exports = composeDeclarations(
  // This part of state is reverted back to initial state when 'logout' is dispatched.
  sensitiveData({
    token: null
  }),

  {
    // This part of state isn't changed on logout
    state: {
      lastLogin: null
    },

    actions: {
      login(token) {
        this.dispatch('login', {
          token,
          time: new Date().toISOString()
        });
      },
      logout() {
        this.dispatch('logout');
      }
    },

    reducers: {
      login: (state, { token, time }) => ({
        ...state,
        token,
        lastLogin: time
      })
      // No need for logout reducer: clearing the token is handled by sensitiveData
    }
  }
);

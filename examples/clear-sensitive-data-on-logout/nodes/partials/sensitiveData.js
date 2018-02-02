/*
* Takes initial state as an argument and returns a declaration which
* automatically reverts the state back to initial state when action of
* type 'auth/logout' is dispatched.
*/
module.exports = initialState => ({
  state: initialState,
  reducer: (state, action) =>
    action.type === 'auth/logout' ? { ...state, ...initialState } : state
});

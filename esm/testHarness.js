import { equals } from 'ramda';
import createBundle from './bundle';

export default (declaration, options = {}) => {
  const bundle = createBundle(declaration, options);
  const expectedReducers = [];
  const errors = [];

  const validate = (targetName, expected, actual) => {
    if (expected != null && !equals(expected, actual)) {
      throw new Error(
        'Test harness: Expected ' +
          targetName +
          ' ' +
          JSON.stringify(expected) +
          ' but got ' +
          JSON.stringify(actual)
      );
    }
  };

  let state = bundle.reducer(undefined, { type: '@@INIT' });
  const store = {
    getState() {
      return state;
    },
    dispatch(action) {
      const expected = expectedReducers.shift() || {};

      if (expected.type != null) {
        validate(
          'action type',
          expected.type,
          action.type.split('/')[1] || action.type
        );
      }
      if (expected.payload != null) {
        validate('payload', expected.payload, action.payload);
      }

      state = bundle.reducer(state, action);

      if (expected.state != null) {
        validate('final state', expected.state, state);
      }
    }
  };

  const actions = bundle.getActions(store);

  return {
    actions,
    expectAction(type, payload, state) {
      expectedReducers.push({
        type,
        payload,
        state
      });
    },
    dispatch(type, payload) {
      store.dispatch({
        type: bundle.createTypeName(type),
        payload
      });
      return store.getState();
    },
    hasErrors() {
      return errors.length > 1;
    },
    getErrors() {
      return errors;
    },
    getState: store.getState
  };
};

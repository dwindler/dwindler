import { clone, equals } from 'ramda';

export default node => {
  const expectedMutations = [];
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

  let state = node.reducer(undefined, { type: '@@INIT' });
  const store = {
    getState() {
      return state;
    },
    dispatch(action) {
      const expected = expectedMutations.shift() || {};

      if (expected.type != null) {
        validate('action type', expected.type, action.type.split('/')[1]);
      }
      if (expected.payload != null) {
        validate('payload', expected.payload, action.payload);
      }

      state = node.reducer(state, action);

      if (expected.state != null) {
        validate('final state', expected.state, state);
      }
    }
  };

  const actions = node.getActions(store);

  return {
    actions,
    willMutate(type, payload, state) {
      expectedMutations.push({
        type,
        payload,
        state
      });
    },
    hasErrors() {
      return errors.length > 1;
    },
    getErrors() {
      return errors;
    }
  };
};

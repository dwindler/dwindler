const test = require('tape');
const { testHarness } = require('..');

test('Correctly implemented action creator does not generate errors', t => {
  const user = {
    state: {
      isLoading: false,
      name: null
    },
    actions: {
      getName() {
        this.dispatch('start');
        this.dispatch('success', 'Mary');
      }
    },
    reducers: {
      start: { isLoading: true },
      success: (state, name) => ({ isLoading: false, name })
    }
  };

  const userTest = testHarness(user);
  userTest.expectAction('start', null, { isLoading: true, name: null });
  userTest.expectAction('success', 'Mary', { isLoading: false, name: 'Mary' });

  t.doesNotThrow(userTest.actions.getName);
  t.end();
});

test('Incorrectly implemented action creator generates errors', t => {
  const user = {
    state: {
      isLoading: false,
      name: null
    },
    actions: {
      getName() {
        this.dispatch('start');
        this.dispatch('success', 'Mary');
      }
    },
    reducers: {
      start: { isLoading: true },
      success: (state, name) => ({ name })
    }
  };

  const userTest = testHarness(user);
  userTest.expectAction('start', null, { isLoading: true, name: null });
  userTest.expectAction('success', 'Mary', { isLoading: false, name: 'Mary' });

  t.throws(userTest.actions.getName);
  t.end();
});

test('Action creator using getState() does not generate errors', t => {
  const counter = {
    state: {
      value: 1
    },
    actions: {
      increase() {
        this.setState({ value: this.getState().value + 1 });
      }
    }
  };

  const counterTest = testHarness(counter);
  counterTest.expectAction('setState', { value: 2 }, { value: 2 });

  t.doesNotThrow(counterTest.actions.increase);
  t.end();
});

test('Action creator using getAppState() does not generate errors', t => {
  const left = {
    state: {
      value: 'left'
    }
  };

  const right = {
    state: {
      value: null
    },
    actions: {
      copyFromLeft() {
        this.setState({ value: this.getAppState().left.value });
      }
    }
  };

  const root = {
    children: { left, right }
  };

  const rootTest = testHarness(root);
  rootTest.expectAction(
    'setState',
    { value: 'left' },
    {
      left: { value: 'left' },
      right: { value: 'left' }
    }
  );

  t.doesNotThrow(rootTest.actions.right.copyFromLeft);
  t.end();
});

test('Reducers can be tested correctly', t => {
  const calc = {
    state: {
      value: 0
    },
    reducers: {
      add: (state, n) => ({ value: state.value + n }),
      multiply: (state, n) => ({ value: state.value * n })
    }
  };

  const calcTest = testHarness(calc);
  t.deepEqual(calcTest.dispatch('add', 5), { value: 5 }, 'add works');
  t.deepEqual(
    calcTest.dispatch('multiply', 2),
    { value: 10 },
    'multiply works'
  );
  t.end();
});

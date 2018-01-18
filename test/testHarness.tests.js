const test = require('tape');
const { node, testHarness } = require('..');

test('Correctly mutation action creator does not generate errors', t => {
  const user = node({
    name: 'user',
    state: {
      isLoading: false,
      name: null
    },
    actions: {
      getName() {
        this.mutate('start');
        this.mutate('success', 'Mary');
      }
    },
    mutations: {
      start: { isLoading: true },
      success: (state, name) => ({ isLoading: false, name })
    }
  });

  const userTest = testHarness(user);
  userTest.willMutate('start', null, { isLoading: true, name: null });
  userTest.willMutate('success', 'Mary', { isLoading: false, name: 'Mary' });

  t.doesNotThrow(userTest.actions.getName);
  t.end();
});

test('Incorrectly mutating action creator does not generate errors', t => {
  const user = node({
    name: 'user',
    state: {
      isLoading: false,
      name: null
    },
    actions: {
      getName() {
        this.mutate('start');
        this.mutate('success', 'Mary');
      }
    },
    mutations: {
      start: { isLoading: true },
      success: (state, name) => ({ name })
    }
  });

  const userTest = testHarness(user);
  userTest.willMutate('start', null, { isLoading: true, name: null });
  userTest.willMutate('success', 'Mary', { isLoading: false, name: 'Mary' });

  t.throws(userTest.actions.getName);
  t.end();
});

test('Action creator using getState() does not generate errors', t => {
  const counter = node({
    name: 'counter',
    state: {
      value: 1
    },
    actions: {
      increase() {
        this.setState({ value: this.getState().value + 1 });
      }
    }
  });

  const counterTest = testHarness(counter);
  counterTest.willMutate('setState', { value: 2 }, { value: 2 });

  t.doesNotThrow(counterTest.actions.increase);
  t.end();
});

test('Action creator using getAppState() does not generate errors', t => {
  const left = node({
    name: 'left',
    state: {
      value: 'left'
    }
  });

  const right = node({
    name: 'right',
    state: {
      value: null
    },
    actions: {
      copyFromLeft() {
        this.setState({ value: this.getAppState().left.value });
      }
    }
  });

  const root = node({
    name: 'root',
    children: [left, right]
  });

  const rootTest = testHarness(root);
  rootTest.willMutate(
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

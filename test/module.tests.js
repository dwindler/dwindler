const test = require('tape');
const { bundle } = require('..');
const { createStore } = require('redux');
const { merge } = require('ramda');

const assertRegexp = /Dwindler assertion/;

test('Accept declaration with only name', t => {
  t.doesNotThrow(() => bundle({ name: 'test' }), 'name is string');
  t.doesNotThrow(() => bundle({ name: 12345 }), 'name is number');
  t.doesNotThrow(() => bundle({ name: 0 }), 'name is zero');
  t.end();
});

test('Throw error if declaration has no name or it is invalid', t => {
  t.throws(() => bundle({}), assertRegexp, 'no name');
  t.throws(() => bundle({ name: null }), assertRegexp, 'name is null');
  t.throws(() => bundle({ name: '' }), assertRegexp, 'name is an empty string');
  t.throws(() => bundle({ name: {} }), assertRegexp, 'name is an object');
  t.throws(() => bundle({ name: [] }), assertRegexp, 'name is an array');
  t.throws(
    () => bundle({ name: () => 'foo' }),
    assertRegexp,
    'name is function'
  );
  t.throws(
    () => bundle({ name: false }),
    assertRegexp,
    'name is boolean false'
  );
  t.throws(() => bundle({ name: true }), assertRegexp, 'name is boolean true');
  t.end();
});

test('Creates a single bundle with correct properties', t => {
  try {
    const initialState = {
      str: 'foobar',
      value: 10
    };

    const root = bundle({
      name: 'root',
      state: initialState
    });

    t.equal(root.name, 'root', 'correct name');
    t.deepEqual(root.state, initialState, 'correct initial state');
    t.equal(typeof root.reducer, 'function', 'has reducer function');
    t.equal(typeof root.getActions, 'function', 'has getActions function');
    t.equal(typeof root.setPrefix, 'function', 'has setPrefix function');
    t.end();
  } catch (err) {
    t.fail('Failed with error: ' + err.message);
  }
});

test('Creates a bundle tree with correctly assigned state', t => {
  try {
    const grandchild = bundle({
      name: 'grandchild',
      state: {
        step: 'grandchild'
      }
    });

    const child = bundle({
      name: 'child',
      children: [grandchild],
      state: {
        step: 'child'
      }
    });

    const root = bundle({
      name: 'root',
      children: [child],
      state: {
        step: 'root'
      }
    });

    t.deepEqual(
      root.reducer(undefined, { type: 'test' }),
      {
        step: 'root',
        child: {
          step: 'child',
          grandchild: {
            step: 'grandchild'
          }
        }
      },
      'has correctly build state tree'
    );
    t.end();
  } catch (err) {
    t.fail('Failed with error: ' + err.message);
  }
});

test('Creates a single bundle with working action creators', t => {
  try {
    const root = bundle({
      name: 'root',
      state: {
        a: false,
        b: false,
        c: false,
        d: 10,
        e: null
      },
      reducers: {
        mutateB: {
          b: true
        },
        mutateC: state => merge(state, { c: true }),
        mutateD: state => merge(state, { d: state.d * state.d }),
        mutateE: (state, value) => merge(state, { e: value })
      },
      actions: {
        a() {
          this.setState({ a: true });
        },
        b() {
          this.dispatch('mutateB');
          this.dispatch('mutateC');
          this.dispatch('mutateD');
          this.dispatch('mutateE', 'hello');
        }
      }
    });

    const store = createStore(root.reducer);
    const actions = root.getActions(store);

    t.equal(
      typeof actions.a,
      'function',
      'actions include declared action creator a'
    );
    actions.a();
    t.ok(store.getState().a, 'result A is correct (setState)');

    t.equal(
      typeof actions.b,
      'function',
      'actions include declared action creator b'
    );
    actions.b();

    const state = store.getState();
    t.ok(state.b, 'result B is correct (object mutation)');
    t.ok(state.c, 'result C is correct (simple mutation)');
    t.equal(state.d, 100, 'result D is correct (stateful mutation)');
    t.equal(
      state.e,
      'hello',
      'result E is correct (parametrized stateful mutation)'
    );

    t.end();
  } catch (err) {
    t.fail('Failed with error: ' + err.message);
  }
});

test('Creates a bundle tree with correctly assigned action creators', t => {
  try {
    const grandchild = bundle({
      name: 'grandchild',
      state: {
        step: 'grandchild'
      },
      actions: {
        setGrandchildStep(step) {
          this.setState({ step });
        }
      }
    });

    const child = bundle({
      name: 'child',
      children: [grandchild],
      state: {
        step: 'child'
      },
      actions: {
        setChildStep(step) {
          this.setState({ step });
        }
      }
    });

    const root = bundle({
      name: 'root',
      children: [child],
      state: {
        step: 'root'
      },
      actions: {
        setRootStep(step) {
          this.setState({ step });
        }
      }
    });

    const store = createStore(root.reducer);
    const actions = root.getActions(store);

    t.equal(
      typeof actions.setRootStep,
      'function',
      'action.setRootStep == function'
    );
    t.equal(
      actions.child && typeof actions.child.setChildStep,
      'function',
      'action.child.setChildStep == function'
    );
    t.equal(
      actions.child &&
        actions.child.grandchild &&
        typeof actions.child.grandchild.setGrandchildStep,
      'function',
      'actions.child.grandchild.setGrandchildStep == function'
    );

    actions.setRootStep('ROOT');
    actions.child.setChildStep('CHILD');
    actions.child.grandchild.setGrandchildStep('GRAND');

    const state = store.getState();
    t.equal(state.step, 'ROOT');
    t.equal(state.child.step, 'CHILD');
    t.equal(state.child.grandchild.step, 'GRAND');

    t.end();
  } catch (err) {
    t.fail('Failed with error: ' + err.message);
  }
});

test('Creating a bundle tree with conflicting child and state names throws an error', t => {
  try {
    const value = bundle({ name: 'value' });
    t.throws(
      () =>
        bundle({
          name: 'root',
          children: [value],
          state: {
            value: 0
          }
        }),
      assertRegexp
    );
    t.end();
  } catch (err) {
    t.fail('Failed with error: ' + err.message);
  }
});

test('Creating a bundle with invalid state throws an error', t => {
  t.throws(
    () => bundle({ name: 'x', state: 'foobar' }),
    assertRegexp,
    'state is a string'
  );
  t.throws(
    () => bundle({ name: 'x', state: 123 }),
    assertRegexp,
    'state is a number'
  );
  t.throws(
    () => bundle({ name: 'x', state: [] }),
    assertRegexp,
    'state is an array'
  );
  t.throws(
    () => bundle({ name: 'x', state: () => null }),
    assertRegexp,
    'state is a function'
  );
  t.throws(
    () => bundle({ name: 'x', state: true }),
    assertRegexp,
    'state is boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', state: false }),
    assertRegexp,
    'state is boolean false'
  );
  t.end();
});

test('Creating a bundle with invalid reducers throws an error', t => {
  t.throws(
    () => bundle({ name: 'x', reducers: 'foobar' }),
    assertRegexp,
    'reducers is a string'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: 123 }),
    assertRegexp,
    'reducers is a number'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: [] }),
    assertRegexp,
    'reducers is an array'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: () => null }),
    assertRegexp,
    'reducers is a function'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: true }),
    assertRegexp,
    'reducers is boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: false }),
    assertRegexp,
    'reducers is boolean false'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: 'foo' } }),
    assertRegexp,
    'reducers is an object with a string'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: 123 } }),
    assertRegexp,
    'reducers is an object with a number'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: null } }),
    assertRegexp,
    'reducers is an object with null'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: [] } }),
    assertRegexp,
    'reducers is an object with an array'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: true } }),
    assertRegexp,
    'reducers is an object with boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', reducers: { a: false } }),
    assertRegexp,
    'reducers is an object with boolean false'
  );
  t.end();
});

test('Creating a bundle with invalid actions throws an error', t => {
  t.throws(
    () => bundle({ name: 'x', actions: 'foobar' }),
    assertRegexp,
    'actions is a string'
  );
  t.throws(
    () => bundle({ name: 'x', actions: 123 }),
    assertRegexp,
    'actions is a number'
  );
  t.throws(
    () => bundle({ name: 'x', actions: [] }),
    assertRegexp,
    'actions is an array'
  );
  t.throws(
    () => bundle({ name: 'x', actions: () => null }),
    assertRegexp,
    'actions is a function'
  );
  t.throws(
    () => bundle({ name: 'x', actions: true }),
    assertRegexp,
    'actions is boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', actions: false }),
    assertRegexp,
    'actions is boolean false'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: 'foo' } }),
    assertRegexp,
    'actions is an object with a string'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: 123 } }),
    assertRegexp,
    'actions is an object with a number'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: null } }),
    assertRegexp,
    'actions is an object with null'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: {} } }),
    assertRegexp,
    'actions is an object with an object'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: [] } }),
    assertRegexp,
    'actions is an object with an array'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: true } }),
    assertRegexp,
    'actions is an object with boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', actions: { a: false } }),
    assertRegexp,
    'actions is an object with boolean false'
  );
  t.end();
});

test('Creating a bundle with invalid children throws an error', t => {
  t.throws(
    () => bundle({ name: 'x', children: 'foobar' }),
    assertRegexp,
    'children is a string'
  );
  t.throws(
    () => bundle({ name: 'x', children: 123 }),
    assertRegexp,
    'children is a number'
  );
  t.throws(
    () => bundle({ name: 'x', children: () => null }),
    assertRegexp,
    'children is a function'
  );
  t.throws(
    () => bundle({ name: 'x', children: true }),
    assertRegexp,
    'children is boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', children: false }),
    assertRegexp,
    'children is boolean false'
  );
  t.throws(
    () => bundle({ name: 'x', children: {} }),
    assertRegexp,
    'children is an object'
  );
  t.throws(
    () => bundle({ name: 'x', children: ['child'] }),
    assertRegexp,
    'children is an array with a string'
  );
  t.throws(
    () => bundle({ name: 'x', children: [123] }),
    assertRegexp,
    'children is an array with a number'
  );
  t.throws(
    () => bundle({ name: 'x', children: [null] }),
    assertRegexp,
    'children is an array with null'
  );
  t.throws(
    () => bundle({ name: 'x', children: [{}] }),
    assertRegexp,
    'children is an array with an object'
  );
  t.throws(
    () => bundle({ name: 'x', children: [[]] }),
    assertRegexp,
    'children is an array with an array'
  );
  t.throws(
    () => bundle({ name: 'x', children: [true] }),
    assertRegexp,
    'children is an array with boolean true'
  );
  t.throws(
    () => bundle({ name: 'x', children: [false] }),
    assertRegexp,
    'children is an array with boolean false'
  );
  t.throws(
    () => bundle({ name: 'x', children: [() => null] }),
    assertRegexp,
    'children is an array with non-bundle function'
  );
  t.end();
});

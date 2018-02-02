const test = require('tape');
const { testHarness } = require('..');
const SeamblessImmutable = require('seamless-immutable');
const ImmutableJS = require('immutable');

test('Integrates with seamless-immutable', t => {
  const user = {
    state: SeamblessImmutable({
      name: null
    }),
    actions: {
      setName(name) {
        this.dispatch('setName', name);
      }
    },
    reducers: {
      setName: (state, name) => state.set('name', name)
    }
  };

  const userTest = testHarness(user);

  userTest.expectAction('setName', 'Mary', {
    name: 'Mary'
  });

  t.doesNotThrow(() => userTest.actions.setName('Mary'));
  t.equal(userTest.getState().name, 'Mary');
  t.end();
});

test('Integrates with with Immutable.js', t => {
  const user = {
    state: ImmutableJS.fromJS({
      personal: {
        name: null
      }
    }),
    actions: {
      setName(name) {
        this.dispatch('setName', name);
      }
    },
    reducers: {
      setName: (state, name) => state.setIn(['personal', 'name'], name)
    }
  };

  const userTest = testHarness(user);

  userTest.expectAction('setName', 'Mary');

  t.doesNotThrow(() => userTest.actions.setName('Mary'));
  t.equal(userTest.getState().getIn(['personal', 'name']), 'Mary');
  t.end();
});

const test = require('tape');
const { node, composeDeclarations } = require('..');

test('Composing with names takes the right name', t => {
  const declA = { name: 'A' };
  const declB = { name: 'B' };
  const declC = { name: 'C' };
  const declAB = composeDeclarations(declA, declB);
  const declABC = composeDeclarations(declA, declB, declC);
  t.equal(declAB.name, declB.name);
  t.equal(declABC.name, declC.name);
  t.end();
});

test('Composing with states takes the right name', t => {
  const declA = {
    state: {
      age: 10,
      dimensions: {
        x: 5,
        y: 6
      }
    }
  };
  const declB = {
    state: {
      name: 'Blob'
    }
  };
  const declC = {
    state: {
      dimensions: {
        z: 7
      }
    }
  };
  const declABC = composeDeclarations(declA, declB, declC);
  t.deepEqual(declABC, {
    state: {
      age: 10,
      dimensions: {
        x: 5,
        y: 6,
        z: 7
      },
      name: 'Blob'
    }
  });
  t.end();
});

test('Composing custom reducers creates a new working reducer', t => {
  const declA = {
    state: {
      number: 0
    },
    reducer(state, action) {
      switch (action.type) {
        case 'A':
          return { ...state, number: 1 };
        default:
          return state;
      }
    }
  };

  const declB = {
    state: {
      name: null
    },
    reducer(state, action) {
      switch (action.type) {
        case 'B':
          return { ...state, name: 'Foo' };
        default:
          return state;
      }
    }
  };

  const n = node(composeDeclarations({ name: 'test' }, declA, declB));

  let state = n.reducer(n.state, { type: 'A' });
  t.equal(state.number, 1);
  t.equal(state.name, null);
  state = n.reducer(n.state, { type: 'B' });
  t.equal(state.number, 0);
  t.equal(state.name, 'Foo');

  t.end();
});

'use strict';

const R = require('ramda');

const assertError = msg => {
  throw new TypeError(`Dwindler assertion: ${msg}`);
};

const isStrictlyObject = x => typeof x === 'object' && !Array.isArray(x) && x != null;
const isNode = x => isStrictlyObject(x) && typeof x.name === 'string' && typeof x.reducer === 'function' && typeof x.setPrefix === 'function' && typeof x.getActions === 'function' && typeof x.state === 'object';

const mapObjKeys = (func, obj) => R.zipObj(R.map(func, R.keys(obj)), R.values(obj));

const assertString = (str, valueName) => {
  if (typeof str !== 'string' && typeof str !== 'number') {
    assertError(`Invalid "${valueName}" property: ${str}`);
  }
  if (str.toString().length === 0) {
    assertError(`Property "${valueName}" is an empty string`);
  }
};

const assertDuplications = (a, b, description) => {
  const duplicates = R.intersection(a, b);
  if (duplicates.length > 0) {
    assertError(`Conflict - ${description} have conflicting values: ${duplicates.join(', ')}`);
  }
};

const assertState = state => {
  if (state != null) {
    if (!isStrictlyObject(state)) {
      assertError(`Invalid state (expected an object): ${state}`);
    }
  }
};

const assertMutations = mutations => {
  if (mutations != null) {
    if (!isStrictlyObject(mutations)) {
      assertError(`Invalid mutations (expected an object): ${mutations}`);
    }
    R.forEachObjIndexed((mutation, name) => {
      if (typeof mutation !== 'function' && !isStrictlyObject(mutation)) {
        assertError(`Invalid mutation (expeced a function or an object) ${name}: ${mutation}`);
      }
    }, mutations);
  }
};

const assertActions = actions => {
  if (actions != null) {
    if (!isStrictlyObject(actions)) {
      assertError(`Invalid actions (expected an object of functions): ${actions}`);
    }
    R.forEachObjIndexed((action, name) => {
      if (typeof action !== 'function') {
        assertError(`Invalid action creator (expected a function) ${name}: ${action}`);
      }
    }, actions);
  }
};

const assertChildren = children => {
  if (children != null) {
    if (!Array.isArray(children)) {
      assertError(`Invalid children (expected an array): ${children}`);
    }
    R.forEach(child => {
      if (!isNode(child)) {
        assertError(`Invalid child (expected a node): ${child}`);
      }
    }, children);
  }
};

// Dev tool

const printActions = (actions, prefix = 'actions') => {
  R.forEachObjIndexed((action, name) => {
    const fullName = prefix + '.' + name;
    if (typeof action === 'function') {
      // eslint-disable-next-line no-undef, no-console
      console.log(fullName);
    } else {
      printActions(action, fullName);
    }
  })(actions);
};

module.exports = {
  mapObjKeys,
  assertString,
  assertDuplications,
  assertState,
  assertMutations,
  assertActions,
  assertChildren,
  printActions
};
import {
  forEach,
  forEachObjIndexed,
  intersection,
  keys,
  map,
  values,
  zipObj
} from 'ramda';

export const assertError = msg => {
  throw new TypeError(`Dwindler assertion: ${msg}`);
};

export const isStrictlyObject = x =>
  typeof x === 'object' && !Array.isArray(x) && x != null;

export const isBundle = x =>
  isStrictlyObject(x) &&
  typeof x.name === 'string' &&
  typeof x.reducer === 'function' &&
  typeof x.setPrefix === 'function' &&
  typeof x.getActions === 'function' &&
  typeof x.state === 'object';

export const mapObjKeys = (func, obj) =>
  zipObj(map(func, keys(obj)), values(obj));

export const assertString = (str, valueName) => {
  if (typeof str !== 'string' && typeof str !== 'number') {
    assertError(`Invalid "${valueName}" property: ${str}`);
  }
  if (str.toString().length === 0) {
    assertError(`Property "${valueName}" is an empty string`);
  }
};

export const assertDuplications = (a, b, description) => {
  const duplicates = intersection(a, b);
  if (duplicates.length > 0) {
    assertError(
      `Conflict - ${description} have conflicting values: ${duplicates.join(
        ', '
      )}`
    );
  }
};

export const assertState = state => {
  if (state != null) {
    if (!isStrictlyObject(state)) {
      assertError(`Invalid state (expected an object): ${state}`);
    }
  }
};

export const assertReducers = reducers => {
  if (reducers != null) {
    if (!isStrictlyObject(reducers)) {
      assertError(
        `Invalid property "reducers" (expected an object): ${reducers}`
      );
    }
    forEachObjIndexed((reducer, name) => {
      if (typeof reducer !== 'function' && !isStrictlyObject(reducer)) {
        assertError(
          `Invalid reducer (expeced a function or an object) ${name}: ${reducer}`
        );
      }
    }, reducers);
  }
};

export const assertActions = actions => {
  if (actions != null) {
    if (!isStrictlyObject(actions)) {
      assertError(
        `Invalid actions (expected an object of functions): ${actions}`
      );
    }
    forEachObjIndexed((action, name) => {
      if (typeof action !== 'function') {
        assertError(
          `Invalid action creator (expected a function) ${name}: ${action}`
        );
      }
    }, actions);
  }
};

export const assertChildren = children => {
  if (children != null) {
    if (!Array.isArray(children)) {
      assertError(`Invalid children (expected an array): ${children}`);
    }
    forEach(child => {
      if (!isBundle(child)) {
        assertError(`Invalid child (expected a bundle): ${child}`);
      }
    }, children);
  }
};

// Dev tool

export const printActions = (actions, prefix = 'actions') => {
  forEachObjIndexed((action, name) => {
    const fullName = prefix + '.' + name;
    if (typeof action === 'function') {
      // eslint-disable-next-line no-undef, no-console
      console.log(fullName);
    } else {
      printActions(action, fullName);
    }
  })(actions);
};

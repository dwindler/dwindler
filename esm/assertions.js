import { forEach, forEachObjIndexed, intersection, keys } from 'ramda';

export const throwAssertError = msg => {
  throw new TypeError(`Dwindler assertion: ${msg}`);
};

export const isStrictlyObject = x =>
  typeof x === 'object' && !Array.isArray(x) && x != null;

export const assertDuplications = (a, b, description) => {
  const duplicates = intersection(a, b);
  if (duplicates.length > 0) {
    throwAssertError(
      `Conflict - ${description} have conflicting values: ${duplicates.join(
        ', '
      )}`
    );
  }
};

export const assertState = state => {
  if (state != null) {
    if (!isStrictlyObject(state)) {
      throwAssertError(`Invalid state (expected an object): ${state}`);
    }
  }
};

export const assertReducers = reducers => {
  if (reducers != null) {
    if (!isStrictlyObject(reducers)) {
      throwAssertError(
        `Invalid property "reducers" (expected an object): ${reducers}`
      );
    }
    forEachObjIndexed((reducer, name) => {
      if (typeof reducer !== 'function' && !isStrictlyObject(reducer)) {
        throwAssertError(
          `Invalid reducer (expeced a function or an object) ${name}: ${reducer}`
        );
      }
    }, reducers);
  }
};

export const assertActions = actions => {
  if (actions != null) {
    if (!isStrictlyObject(actions)) {
      throwAssertError(
        `Invalid actions (expected an object of functions): ${actions}`
      );
    }
    forEachObjIndexed((action, name) => {
      if (typeof action !== 'function') {
        throwAssertError(
          `Invalid action creator (expected a function) ${name}: ${action}`
        );
      }
    }, actions);
  }
};

export const assertChildren = children => {
  if (children != null) {
    if (!isStrictlyObject(children)) {
      throwAssertError(`Invalid children (expected an object): ${children}`);
    }
    forEach(assertDeclaration, children);
  }
};

export const assertDeclaration = declaration => {
  if (!isStrictlyObject(declaration)) {
    throwAssertError(
      `Invalid declaration (expected an object): ${declaration}`
    );
  }
  const { state, reducers, actions, children } = declaration;
  assertState(state);
  assertReducers(reducers);
  assertActions(actions);
  assertChildren(children);
  if (state && children) {
    assertDuplications(
      keys(state),
      keys(children),
      'state properties and child names'
    );
  }
};

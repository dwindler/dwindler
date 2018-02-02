import {
  identity,
  keys,
  map,
  mapObjIndexed,
  merge,
  path,
  values,
  zipObj
} from 'ramda';

import { assertDeclaration } from './assertions';

const mapObjKeys = (func, obj) => zipObj(map(func, keys(obj)), values(obj));

const bundle = (declaration = {}, options = {}) => {
  const {
    state = {},
    actions = {},
    reducers = {},
    children = {},
    reducer: customReducer
  } = declaration;
  const { name, services = {} } = options;

  assertDeclaration(declaration);

  // Setup variable mapping and functions.
  // These will change if the bundle is attached to another bundle as a child.
  const createTypeName = key => (name ? `${name}/${key}` : key);
  const selectState = name
    ? path(
        name
          .split('.')
          .slice(1)
          .concat(name)
      )
    : identity;

  const bundledReducers = mapObjKeys(
    createTypeName,
    merge(reducers, { setState: merge })
  );

  // Attach and update child bundles
  const childNodes = mapObjIndexed(
    (child, name) => bundle(child, { name, services }),
    children
  );

  const reducer = (prevState = state, action) => {
    const { type, payload } = action;

    // Is it one of the bundle's reducers?
    const reducer = bundledReducers[type];
    if (reducer) {
      return typeof reducer === 'function'
        ? reducer(prevState, payload)
        : merge(prevState, reducer);
    }

    // Pass to the children...
    let nextState = prevState;
    for (const childName of keys(childNodes)) {
      const child = childNodes[childName];
      const prevChildState = prevState[childName];
      const nextChildState = child.reducer(prevChildState, action);
      if (nextChildState !== prevChildState) {
        nextState = merge(nextState, { [childName]: nextChildState });
      }
    }

    return customReducer ? customReducer(nextState, action) : nextState;
  };

  const getActions = store => {
    const context = {
      dispatch(typeOrAction, payload) {
        if (typeof typeOrAction === 'string') {
          store.dispatch({ type: createTypeName(typeOrAction), payload });
        } else {
          store.dispatch(typeOrAction);
        }
      },
      setState(newState) {
        store.dispatch({ type: createTypeName('setState'), payload: newState });
      },
      getState: () => selectState(store.getState()),
      getAppState: () => store.getState(),
      services
    };
    const myActions = map(func => func.bind(context), actions);
    const childActions = map(child => child.getActions(store), childNodes);
    return merge(myActions, childActions);
  };

  return {
    reducer,
    getActions,
    createTypeName
  };
};

export default bundle;

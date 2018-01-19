import { identity, keys, map, merge, path, pluck, slice, zipObj } from 'ramda';
import {
  mapObjKeys,
  assertString,
  assertDuplications,
  assertState,
  assertReducers,
  assertActions,
  assertChildren
} from './assertions';

export default (declaration = {}) => {
  const {
    name = null,
    state = {},
    actions = {},
    reducers = {},
    children = [],
    reducer: customReducer
  } = declaration;

  // Check input validity
  assertString(name, 'name');
  const childNames = pluck('name', children);
  assertDuplications(
    keys(state),
    childNames,
    'state properties and child names'
  );
  assertState(state);
  assertReducers(reducers);
  assertActions(actions);
  assertChildren(children);

  // Setup variable mapping and functions.
  // These will change if the bundle is attached to another bundle as a child.
  let bundleReducers = null;
  let selectState = null;
  let createTypeName = key => `${name}/${key}`;

  const updateTypeNames = newPrefix => {
    createTypeName = key => `${newPrefix ? newPrefix + '.' : ''}${name}/${key}`;
    bundleReducers = mapObjKeys(createTypeName, reducers);
    selectState = newPrefix
      ? path(slice(1, Infinity, newPrefix.split('.').concat(name)))
      : identity;
  };

  updateTypeNames();

  // Attach and update child bundles
  children.forEach(child => child.setPrefix(name));
  const zipChildren = prop => zipObj(childNames, pluck(prop, children));
  const initialState = merge(state, zipChildren('state'));

  const reducer = (prevState = initialState, action) => {
    const { type, payload } = action;

    // Is it a setState action?
    if (type === createTypeName('setState')) {
      return merge(prevState, payload);
    }

    // Is it one of the bundle's reducers?
    const reducer = bundleReducers[type];
    if (reducer) {
      return merge(
        prevState,
        typeof reducer === 'function' ? reducer(prevState, payload) : reducer
      );
    }

    // Pass to the children...
    for (const child of children) {
      const childState = prevState[child.name];
      const nextState = child.reducer(childState, action);
      if (nextState !== childState) {
        return merge(prevState, { [child.name]: nextState });
      }
    }

    return customReducer ? customReducer(prevState, action) : prevState;
  };

  const getActions = store => {
    const context = {
      dispatch(typeOrAction, payload) {
        if (typeof typeOrAction === 'object') {
          store.dispatch(typeOrAction);
        } else {
          store.dispatch({ type: createTypeName(typeOrAction), payload });
        }
      },
      setState(newState) {
        store.dispatch({ type: createTypeName('setState'), payload: newState });
      },
      getState: () => selectState(store.getState()),
      getAppState: () => store.getState()
    };
    const myActions = map(func => func.bind(context), actions);
    const childActions = zipObj(
      childNames,
      map(child => child.getActions(store), children)
    );
    return merge(myActions, childActions);
  };

  return {
    name,
    state,
    reducer,
    getActions,
    setPrefix: updateTypeNames,
    createTypeName
  };
};

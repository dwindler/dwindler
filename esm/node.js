import { identity, keys, map, merge, path, pluck, slice, zipObj } from 'ramda';
import {
  mapObjKeys,
  assertString,
  assertDuplications,
  assertState,
  assertMutations,
  assertActions,
  assertChildren
} from './assertions';

export default (declaration = {}) => {
  const {
    name = null,
    state = {},
    actions = {},
    mutations = {},
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
  assertMutations(mutations);
  assertActions(actions);
  assertChildren(children);

  // Setup variable mapping and functions.
  // These will change if the node is attached to another node as a child.
  let mappedMutations = null;
  let selectState = null;
  let createTypeName = key => `${name}/${key}`;

  const updateTypeNames = newPrefix => {
    createTypeName = key => `${newPrefix ? newPrefix + '.' : ''}${name}/${key}`;
    mappedMutations = mapObjKeys(createTypeName, mutations);
    selectState = newPrefix
      ? path(slice(1, Infinity, newPrefix.split('.').concat(name)))
      : identity;
  };

  updateTypeNames();

  // Attach and update child nodes
  children.forEach(child => child.setPrefix(name));
  const zipChildren = prop => zipObj(childNames, pluck(prop, children));
  const initialState = merge(state, zipChildren('state'));

  const reducer = (prevState = initialState, action) => {
    const { type, payload } = action;

    // Is setState action?
    if (type === createTypeName('setState')) {
      return merge(prevState, payload);
    }

    // Is one of this nodes mutators?
    const mutation = mappedMutations[type];
    if (mutation) {
      return merge(
        prevState,
        typeof mutation === 'function' ? mutation(prevState, payload) : mutation
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
      mutate(key, payload) {
        store.dispatch({ type: createTypeName(key), payload });
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
    setPrefix: updateTypeNames
  };
};

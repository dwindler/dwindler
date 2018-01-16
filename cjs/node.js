'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

var _assertions = require('./assertions');

exports.default = (declaration = {}) => {
  const {
    name = null,
    state = {},
    actions = {},
    mutations = {},
    children = [],
    reducer: customReducer
  } = declaration;

  // Check input validity
  (0, _assertions.assertString)(name, 'name');
  const childNames = (0, _ramda.pluck)('name', children);
  (0, _assertions.assertDuplications)((0, _ramda.keys)(state), childNames, 'state properties and child names');
  (0, _assertions.assertState)(state);
  (0, _assertions.assertMutations)(mutations);
  (0, _assertions.assertActions)(actions);
  (0, _assertions.assertChildren)(children);

  // Setup variable mapping and functions.
  // These will change if the node is attached to another node as a child.
  let mappedMutations = null;
  let selectState = null;
  let createTypeName = key => `${name}/${key}`;

  const updateTypeNames = newPrefix => {
    createTypeName = key => `${newPrefix ? newPrefix + '.' : ''}${name}/${key}`;
    mappedMutations = (0, _assertions.mapObjKeys)(createTypeName, mutations);
    selectState = newPrefix ? (0, _ramda.path)((0, _ramda.slice)(1, Infinity, newPrefix.split('.').concat(name))) : _ramda.identity;
  };

  updateTypeNames();

  // Attach and update child nodes
  children.forEach(child => child.setPrefix(name));
  const zipChildren = prop => (0, _ramda.zipObj)(childNames, (0, _ramda.pluck)(prop, children));
  const initialState = (0, _ramda.merge)(state, zipChildren('state'));

  const reducer = (prevState = initialState, action) => {
    const { type, payload } = action;

    // Is setState action?
    if (type === createTypeName('setState')) {
      return (0, _ramda.merge)(prevState, payload);
    }

    // Is one of this nodes mutators?
    const mutation = mappedMutations[type];
    if (mutation) {
      return (0, _ramda.merge)(prevState, typeof mutation === 'function' ? mutation(prevState, payload) : mutation);
    }

    // Pass to the children...
    for (const child of children) {
      const childState = prevState[child.name];
      const nextState = child.reducer(childState, action);
      if (nextState !== childState) {
        return (0, _ramda.merge)(prevState, { [child.name]: nextState });
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
    const myActions = (0, _ramda.map)(func => func.bind(context), actions);
    const childActions = (0, _ramda.zipObj)(childNames, (0, _ramda.map)(child => child.getActions(store), children));
    return (0, _ramda.merge)(myActions, childActions);
  };

  return {
    name,
    state,
    reducer,
    getActions,
    setPrefix: updateTypeNames
  };
};
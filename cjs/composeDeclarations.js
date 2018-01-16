'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

exports.default = (...declarations) => {
  const composition = (0, _ramda.reduce)(_ramda.mergeDeepRight, {}, declarations);
  const reducers = (0, _ramda.pipe)((0, _ramda.pluck)('reducer'), (0, _ramda.filter)(_ramda.identity))(declarations);
  if (reducers.length > 0) {
    composition.reducer = (state, action) => reducers.reduce((currentState, reducer) => reducer(currentState, action), state);
  }
  return composition;
};
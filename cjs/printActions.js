'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

const printActions = (actions, prefix = 'actions') => {
  (0, _ramda.forEachObjIndexed)((action, name) => {
    const fullName = prefix + '.' + name;
    if (typeof action === 'function') {
      // eslint-disable-next-line no-undef, no-console
      console.log(fullName);
    } else {
      printActions(action, fullName);
    }
  })(actions);
};

exports.default = printActions;
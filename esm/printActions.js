import { forEachObjIndexed } from 'ramda';

const printActions = (actions, prefix = 'actions') => {
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

export default printActions;

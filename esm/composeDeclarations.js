import { filter, identity, mergeDeepRight, pipe, pluck, reduce } from 'ramda';

export default (...declarations) => {
  const composition = reduce(mergeDeepRight, {}, declarations);
  const reducers = pipe(pluck('reducer'), filter(identity))(declarations);
  if (reducers.length > 0) {
    composition.reducer = (state, action) =>
      reducers.reduce(
        (currentState, reducer) => reducer(currentState, action),
        state
      );
  }
  return composition;
};

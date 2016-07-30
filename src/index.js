import adapters from './adapters';
import { getAdapter, debounce } from './utils';

/**
 * Default options for middleware.
 * @type {Object}
 */
const defaultOpts = {
  throttle: 2000,
  pick (state) {
    return state;
  },
  onLoad (storedState, dispatch) {
    dispatch({ type: 'LOAD_STORED_STATE', storedState });
  },
  clearStorage (action) {
    return (action.type === 'CLEAR_STORED_STATE');
  }
};

/**
 * Returns a new middleware function for Redux using the given
 * parameters.
 *
 * @param  {Object} opts
 * @return {Function}
 */
export default function reduxSessionMiddleware (opts = {}) {
  // define our default options
  opts = Object.assign({}, defaultOpts, opts);

  // get the namespace from the options
  const { ns } = opts;

  // determine the storage adapter
  const storage = getAdapter(adapters, opts.adapter);

  return function (store) {
    // watch for redux store changes so we can store them
    store.subscribe(debounce(function () {
      const state = opts.pick(store.getState());
      storage.set(ns, state, opts);
    }, opts.throttle));

    // dispatch action to hydrate state (if any)
    if (storage.has(ns, opts)) {
      opts.onLoad(storage.get(ns, opts), store.dispatch);
    }

    return next => action => {
      if (opts.clearStorage(action)) {
        storage.clear(ns, opts);
      }
      next();
    }
  }
}

import adapters from './adapters/index';
import { getAdapter, debounce } from './utils';

/**
 * Valid namespace definition
 * @type {RegExp}
 */
const VALID_NS = /[a-zA-Z0-9\.]/;

/**
 * Default options for middleware.
 * @type {Object}
 */
const defaultOpts = {
  throttle: 2000,
  selectState (state) {
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

  // validate the given namespace
  if (typeof ns !== 'string' || ! VALID_NS.test(ns)) {
    throw new Error('You must provide a valid namespace "ns" for your project!');
  }

  // determine the storage adapter
  const storage = getAdapter(adapters, opts.adapter);

  return function ({ getState, dispatch }) {
    // the function that will update storage
    const updateStorage = debounce(function () {
      const state = opts.selectState(getState());
      storage.set(ns, state, opts);
    }, opts.throttle);

    // dispatch action to hydrate state (if any)
    if (storage.has(ns, opts)) {
      opts.onLoad(storage.get(ns, opts), dispatch);
    }

    return next => action => {
      // check if we should clear storage based on the given action
      if (opts.clearStorage(action)) {
        storage.clear(ns, opts);
      }

      // move the action along...
      next(action);

      // ...and refresh storage!
      updateStorage();
    }
  }
}

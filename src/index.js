import { getAdapter, debounce, shallowOmit } from './utils';
import localStorageAdapter from './adapters/localStorage';
import cookieStorageAdapter from './adapters/cookieStorage';

/**
 * Valid namespace definition
 * @type {RegExp}
 */
const VALID_NS = /[a-zA-Z0-9\.]/;

/**
 * Options that should not be passed to check()
 * @type {Array}
 */
const OMITTED_OPTS = [
  'adapter',
  'onLoad',
  'selectState',
  'clearStorage'
];

/**
 * Default options for middleware.
 * @type {Object}
 */
const defaultOpts = {
  throttle: 2000,
  silent: false,
  onLoad (storedState, dispatch) {
    dispatch({ type: 'LOAD_STORED_STATE', storedState });
  },
  selectState (state) {
    return state;
  },
  clearStorage (action) {
    return (action.type === 'CLEAR_STORED_STATE');
  }
};

/**
 * The built-in adapters that are provided by this library.
 * @type {Object}
 */
export const adapters = {
  localStorage: localStorageAdapter,
  cookieStorage: cookieStorageAdapter
};

/**
 * Returns a new middleware function for Redux using the given
 * parameters.
 *
 * @param  {Object} opts
 * @return {Function}
 */
export function createSession (opts = {}) {
  // define our default options
  opts = Object.assign({}, defaultOpts, opts);

  // get the namespace from opts
  const { ns } = opts;

  // get a partial subset of options to pass to adapter methods
  const _opts = shallowOmit(OMITTED_OPTS, opts);

  // validate the given namespace
  if (typeof ns !== 'string' || ! VALID_NS.test(ns)) {
    throw new Error('You must provide a valid namespace "ns" for your project!');
  }

  // determine the storage adapter
  const storage = getAdapter(adapters, opts.adapter);

  // allow storage to check our options for config issues
  if (typeof storage.check === 'function') {
    storage.check(_opts);
  }

  return function ({ getState, dispatch }) {
    // the function that will update storage
    const updateStorage = debounce(function () {
      const state = opts.selectState(getState());
      storage.set(ns, state, _opts);
    }, opts.throttle);

    return next => action => {
      
      // dispatch action to hydrate state (if any)
      if (storage.has(ns, _opts)) {
        opts.onLoad(storage.get(ns, _opts), next);
      }

      // dispatch the action
      next(action);

      // flag for whether storage should be cleared.
      const shouldClearStorage = opts.clearStorage(action);

      // clear storage if needed
      if (shouldClearStorage) storage.clear(ns, _opts);

      // otherwise, update storage with the latest
      else updateStorage();
    }
  }
}

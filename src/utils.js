/**
 * Returns the appropriate adapter based on the given adapter
 * argument from options.
 *
 * @param  {*} adapter
 * @return {Object}
 */
export function getAdapter (adapters, adapter) {
  // if the adapter is an object that implements the needed methods,
  // quickly return it
  if (typeof adapter === 'object' && adapter.get && adapter.set && adapter.has && adapter.clear) {
    return adapter;
  }

  // if no adapter provided, assume one
  if ( ! adapter) {
    adapter = (window.localStorage ? 'localStorage' : 'cookieStorage');
  }

  // use one of the provides adapters
  if (adapters[adapter]) {
    return adapters[adapter];
  }

  throw new Error('A valid storage adapter could not be found!  You can use one of the default adapters by setting adapter to "localStorage" or "cookieStorage".  Or, if you need something custom, you can provide a simple adapter object with set(), get(), has() and clear() methods.');
}

/**
 * Returns a new object that omits the keys in the given array.
 *
 * @param  {Array} keys
 * @param  {Object} obj
 * @return {Object}
 */
export function shallowOmit (keys, obj) {
  let j = {}, k;
  for (let k in obj) {
    if (keys.indexOf(k) === -1) {
      j[k] = obj[k];
    }
  }
  return j;
}

/**
 * Returns a throttled method that can only be invoked once per the
 * time duration specified.
 *
 * @param  {Function} fn
 * @param  {Number} wait
 */
export function debounce (fn, wait) {
  let timeout, dirty;

  return function () {
    if (timeout) {
      dirty = true;
      return;
    }

    timeout = setTimeout(function () {
      clearTimeout(timeout);
      timeout = null;
      if (dirty) {
        fn.apply(this, arguments);
        dirty = false;
      }
    }, wait);

    fn.apply(this, arguments);
  }
}

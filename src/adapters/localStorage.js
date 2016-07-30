export default {

  /**
   * Stores the given data as a string at the given namespace.
   *
   * @param  {String}
   * @param  {*}
   */
  set (name, data) {
    window.localStorage.setItem(name + '.root', JSON.stringify(data));
  },

  /**
   * Returns the data stored at the given namespace.
   *
   * @param  {String} name
   * @return {*}
   */
  get (name) {
    return JSON.parse(window.localStorage.getItem(name + '.root'));
  },

  /**
   * Returns true if data is stored at the given namespace.
   *
   * @param  {String} name
   * @return {Boolean}
   */
  has (name) {
    return !!window.localStorage.getItem(name + '.root');
  },

  /**
   * Removes the item stored at the given namespace.
   *
   * @param  {String} name
   */
  clear (name) {
    window.localStorage.removeItem(name + '.root');
  }

};

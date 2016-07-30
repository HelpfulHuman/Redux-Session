function notImplementedWarning () {
  console.warn('[redux-session] The cookieStorage adapter has not yet been implemented!  This adapter is merely a stub for functionality that will come soon.  This means that none of your session data has been saved.');
}

export default {

  set (name, data, opts) {
    notImplementedWarning();
  },

  get (name) {
    notImplementedWarning();
  },

  has (name) {
    notImplementedWarning();
  },

  clear (name) {
    notImplementedWarning();
  }

};

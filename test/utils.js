const { stub } = require('sinon');

exports.mockAdapter = function () {
  return {
    check: stub(),
    get: stub(),
    set: stub(),
    has: stub(),
    clear: stub()
  };
}

exports.mockStore = function () {
  return {
    dispatch: stub(),
    getState: stub()
  };
}

exports.mockLocalStorage = function () {
  return {
    setItem: stub(),
    getItem: stub(),
    removeItem: stub()
  };
}

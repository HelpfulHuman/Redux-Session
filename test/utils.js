const { spy } = require('sinon');

exports.mockAdapter = function () {
  return {
    get: spy(),
    set: spy(),
    has: spy(),
    clear: spy()
  };
}

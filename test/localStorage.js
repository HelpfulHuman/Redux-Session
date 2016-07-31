global.window = {};

const { expect } = require('chai');
const { adapters } = require('../');
const { mockLocalStorage } = require('./utils');
const adapter = adapters.localStorage;

describe('adapters/localStorage', function () {

  let ls;

  beforeEach(function () {
    window.localStorage = ls = mockLocalStorage();
  });

  describe('get()', function () {

    it('calls localStorage.getItem() with the desired namespace and parses the data that getItem() returns', function () {
      const data = { foo: 'bar' };
      ls.getItem.returns(JSON.stringify(data));

      const result = adapter.get('test');

      expect(ls.getItem.calledOnce).to.equal(true);
      expect(ls.getItem.firstCall.args[0]).to.equal('test.root');
      expect(result).to.deep.equal(data);
    });

  });

  describe('has()', function () {

    it('returns false if localStorage does not have any kind of data for the given namespace', function () {
      const result = adapter.has('test');

      expect(ls.getItem.calledOnce).to.equal(true);
      expect(ls.getItem.firstCall.args[0]).to.equal('test.root');
      expect(result).to.deep.equal(false);
    });

    it('returns true if localStorage has any kind of data for the given namespace', function () {
      ls.getItem.returns('{}');

      const result = adapter.has('test');

      expect(ls.getItem.calledOnce).to.equal(true);
      expect(ls.getItem.firstCall.args[0]).to.equal('test.root');
      expect(result).to.deep.equal(true);
    });

  });

  describe('set()', function () {

    it('calls localStorage.setItem() with the desired namespace and JSON string for the given data object', function () {
      const data = { foo: 'bar' };
      adapter.set('test', data);

      expect(ls.setItem.called).to.equal(true);
      expect(ls.setItem.firstCall.args[0]).to.equal('test.root');
      expect(ls.setItem.firstCall.args[1]).to.equal(JSON.stringify(data));
    });

  });

  describe('clear()', function () {

    it('calls localStorage.removeItem() with the desired namespace', function () {
      adapter.clear('test');

      expect(ls.removeItem.calledOnce).to.equal(true);
      expect(ls.removeItem.firstCall.args[0]).to.equal('test.root');
    });

  });

});

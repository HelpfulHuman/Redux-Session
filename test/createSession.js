const chai = require('chai');
const { expect } = chai;
const { createSession } = require('../');
const { mockAdapter, mockStore } = require('./utils');
const { spy, stub } = require('sinon');

chai.use(require('sinon-chai'));

global.window = {};

describe('createSession()', function () {

  let ns = 'test', testAdapter, testStore;

  beforeEach(function () {
    testAdapter = mockAdapter();
    testStore = mockStore();
  });

  it('throws an error when a valid namespace is not provided', function () {
    expect(function () {
      createSession();
    }).to.throw('You must provide a valid namespace "ns" for your project!');
  });

  it('allows session middleware to be created with only a valid namespace defined', function () {
    const session = createSession({ ns });

    expect(session).to.be.a('function');
  });

  it('throws an error if an invalid custom adapter object is given', function () {
    expect(function () {
      createSession({ ns, adapter: {} })
    }).to.throw('A valid storage adapter could not be found!  You can use one of the default adapters by setting adapter to "localStorage" or "cookieStorage".  Or, if you need something custom, you can provide a simple adapter object with set(), get(), has() and clear() methods.');
  });

  it('accepts a custom adapter that implements get(), set(), has() and clear()', function () {
    createSession({ ns, adapter: testAdapter });
  });

  it('invokes the adapter\'s check() method with the given options if a check method is specified', function () {
    createSession({
      ns,
      adapter: testAdapter,
      silent: true,
      throttle: 1000
    });

    expect(testAdapter.check).to.have.been.calledOnce;
    expect(testAdapter.check.firstCall.args[0]).to.deep.equal({
      ns,
      silent: true,
      throttle: 1000
    });
  });

  it('invokes the adapter\'s has() method with the namespace but will not attempt to get and dispatch stored state if has() returns false', function () {
    testAdapter.has.returns(false);
    testAdapter.get.returns({});

    const session = createSession({ ns, adapter: testAdapter });
    session(testStore);

    expect(testAdapter.has).to.have.been.calledOnce;
    expect(testAdapter.has).to.have.been.calledWith(ns);
    expect(testAdapter.get).to.not.have.been.called;
    expect(testStore.dispatch).to.not.have.been.called;
  });

  it('invokes the adapter\'s get() method with the namespace if the adapter\'s has() method returns true', function () {
    testAdapter.has.returns(true);
    testAdapter.get.returns({});

    const session = createSession({ ns, adapter: testAdapter });
    session(testStore);

    expect(testAdapter.has).to.have.been.calledOnce;
    expect(testAdapter.get).to.have.been.calledOnce;
    expect(testAdapter.get).to.have.been.calledWith(ns);
  });

  it('dispatches the default action containing the result of the adapter\'s get() method to the store', function () {
    const stored = { foo: 'bar' };
    testAdapter.has.returns(true);
    testAdapter.get.returns(stored);

    const session = createSession({ ns, adapter: testAdapter });
    session(testStore);

    expect(testStore.dispatch).to.have.been.calledOnce;
    expect(testStore.dispatch.firstCall.args[0]).to.deep.equal({
      type: 'LOAD_STORED_STATE',
      storedState: stored
    });
  });

  it('invokes the custom onLoad() function with the result of the adapter\'s get() method when a stored state has been found', function () {
    const stored = { foo: 'bar' };
    testAdapter.has.returns(true);
    testAdapter.get.returns(stored);

    const payload = { type: 'CUSTOM_HYDRATE', foo: 'bar' };
    const onLoad = spy((state, dispatch) => dispatch(payload));
    const session = createSession({ ns, adapter: testAdapter, onLoad });
    session(testStore);

    expect(onLoad).to.have.been.calledOnce;
    expect(onLoad).to.have.been.calledWith(stored, testStore.dispatch);
    expect(testStore.dispatch).to.have.been.calledOnce;
    expect(testStore.dispatch.firstCall.args[0]).to.deep.equal(payload);
  });

  it('invokes the adapter\'s clear() method with the namespace if the dispatched action type if CLEAR_STORED_STATE', function () {
    const action = { type: 'CLEAR_STORED_STATE' };
    const session = createSession({ ns, adapter: testAdapter });
    session(testStore)(testStore.dispatch)(action);

    expect(testStore.dispatch).to.have.been.calledOnce;
    expect(testStore.dispatch).to.have.been.calledWith(action);
    expect(testAdapter.clear).to.have.been.calledOnce;
    expect(testAdapter.clear).to.have.been.calledAfter(testStore.dispatch);
    expect(testAdapter.clear).to.have.been.calledWith(ns);
  });

  it('passes dispatched action data to the clearStorage() method to check if storage should be cleared after dispatching the action to the store', function () {
    const action = { type: 'TEST_CLEAR' };
    const clearStorage = stub().returns(false);
    const session = createSession({ ns, adapter: testAdapter, clearStorage });
    session(testStore)(testStore.dispatch)(action);

    expect(clearStorage).to.have.been.calledOnce;
    expect(clearStorage).to.have.been.calledWith(action);
    expect(testStore.dispatch).to.have.been.calledOnce;
    expect(testStore.dispatch).to.have.been.calledBefore(clearStorage);
    expect(testStore.dispatch).to.have.been.calledWith(action);
  });

  it('invokes the adapter\'s clear() method with the namespace if the clearStorage() function returns true after dispatching the action to the store', function () {
    const action = { type: 'TEST_CLEAR' };
    const clearStorage = stub().returns(true);
    const session = createSession({ ns, adapter: testAdapter, clearStorage });
    session(testStore)(testStore.dispatch)(action);

    expect(clearStorage).to.have.been.calledOnce;
    expect(testAdapter.clear).to.have.been.calledOnce;
    expect(testAdapter.clear).to.have.been.calledWith(ns);
    expect(testStore.dispatch).to.have.been.calledOnce;
    expect(testStore.dispatch).to.have.been.calledBefore(testAdapter.clear);
    expect(testStore.dispatch).to.have.been.calledWith(action);
  });

  it('invokes the adapter\'s set() method with the namespace and with the most recent store state after an action has been dispatched to the store', function () {
    const state = { foo: 'bar' };
    const action = { type: 'TEST' };
    testStore.getState.returns(state);

    const session = createSession({ ns, adapter: testAdapter });
    session(testStore)(testStore.dispatch)(action);

    expect(testStore.dispatch).to.have.been.calledWith(action);
    expect(testStore.getState).to.have.been.calledOnce;
    expect(testStore.getState).to.have.been.calledAfter(testStore.dispatch);
    expect(testAdapter.set).to.have.been.calledOnce;
    expect(testAdapter.set).to.have.been.calledWith(ns, state);
  });

  it('invokes the given selectState() function with the most recent store state after an action has been dispatched to the store', function () {
    const state = { foo: 'bar' };
    const action = { type: 'TEST' };
    const clearStorage = stub().returns(false);
    const selectState = stub().returns(state);
    testStore.getState.returns(state);

    const session = createSession({ ns, adapter: testAdapter, selectState, clearStorage });
    session(testStore)(testStore.dispatch)(action);

    expect(clearStorage).to.have.been.calledOnce;
    expect(testStore.getState).to.have.been.calledOnce;
    expect(testStore.dispatch).to.have.been.calledWith(action);
    expect(selectState).to.have.been.calledOnce;
    expect(selectState).to.have.been.calledWith(state);
  });

  it('invokes the adapter\'s set() method with the namespace and the returned value from the selectState() function after an action has been dispatched to the store', function () {
    const state = { foo: 'bar' };
    const selectedState = { bar: 'baz' };
    const action = { type: 'TEST' };
    const selectState = stub().returns(selectedState);
    testStore.getState.returns(state);

    const session = createSession({ ns, adapter: testAdapter, selectState });
    session(testStore)(testStore.dispatch)(action);

    expect(testStore.dispatch).to.have.been.calledWith(action);
    expect(testStore.getState).to.have.been.calledOnce;
    expect(testStore.getState).to.have.been.calledAfter(testStore.dispatch);
    expect(selectState).to.have.been.calledWith(state);
    expect(testAdapter.set).to.have.been.calledOnce;
    expect(testAdapter.set).to.have.been.calledWith(ns, selectedState);
  });

  it('the created middleware chains the passed action', function () {
    const action = { type: 'TEST' };
    const session = createSession({ ns, adapter: testAdapter });
    testStore.dispatch.withArgs(action).returns(action);

    const result = session(testStore)(testStore.dispatch)(action);

    expect(testStore.dispatch).to.have.been.calledWith(action);
    expect(result).to.be.equal(action);
  });
});

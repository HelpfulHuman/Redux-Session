# Redux Session Middleware

It's often preferable for part of a user's state to be preserved even after the browser tab has been closed or when moving from one route to another.  There are mechanisms and techniques for persisting this data across usage sessions.  Two common examples would be `localStorage` and cookies.  While the interfaces for these tools are fairly straight forward, it often involves littering your code with statements for managing this additional form of state.

With Redux, we can keep our state managed in one place and allow "middleware" to subscribe to state changes or submit their own.  This pattern makes it relatively easy to save and reload state from a storage mechanism without adding tightly coupled storage operations throughout our code.

## Getting Started

This library has support for both ES2015 and ES5 (browser).  Simply run `npm install redux-session` and import the library.

```js
import createSession from 'redux-session';
```

> **Note:** This library does make use of `Object.assign()` so make sure you have a polyfill if you plan to support browsers that don't implement this method.

## Usage

Once you've imported the library, things are pretty straight forward.  Simply invoke the `createSession()` function with your desired configuration options and add the returned middleware to your Redux store.  **Note:** You must provide a unique alphanumeric value as your project namespace ( `ns` ).

This is all you need to persist your state data to a stored session.  When changes occur in your state model, they will be sent to the storage adapter's `set()` method.  When the app loads up, it will check if state the exists in storage and pass the retrieved data to the store as an action.  You can pass additional functions to configure the middleware as needed.

```js
import { createStore, applyMiddleware } from 'redux';
import createSession from 'redux-session';

function reducer (state = {}, action) {
  switch (action.type) {
    case 'LOAD_STORED_STATE':
      return action.storedState;
    default:
      return state;
  }
}

const session = createSession({ ns: 'myproject' });

const store = createStore(reducer, applyMiddleware(session));
```

## Selecting State

Storing your entire application state may seem like a good idea at first, but it can quickly become a problem as your application grows.  A better idea would be to "cherry pick" _only the certain parts of state that you want to persist_.  This can be done by passing a function to the `selectState` option.  This function will receive the full Redux state object and should return a new object containing that parts of state that you want persist.

```js
const session = createSession({
  ns: 'myproject',
  selectState (state) {
    return {
      token: state.auth.token
    };
  }
});
```

## Throttling "Save to Storage" Calls

Because your Redux state could potentially be updated several times a second, it's a good idea to limit how often state changes are evaluated and stored.  By default, the middleware waits 2 seconds between each call to the adapter's `set()` method.  You can specify a custom throttling limit using the `throttle` option.

```js
const session = createSession({
  ns: 'myproject',
  throttle: 5000 // update storage once every 5 seconds
});
```

## Hydrating State

When your store is created and the session middleware is initialized, it will attempt to find state that has previously been stored at the set namespace.  It does so by invoking the adapters `has()` method before fetching the data with the adapter's `get()` method.  Once the stored state has been retrieved it is passed to the `onLoad` option to dispatch the hydration action.  You can specify a custom function to dispatch custom action(s) for hydration.

```js
const session = createSession({
  ns: 'myproject',
  onLoad (storedState, dispatch) {
    dispatch({ type: 'HYDRATE_STATE', storedState })
  }
});
```

## Adapters

An adapter is just a simple abstraction layer over a storage mechanism.  Adapters for `localStorage` and cookies are provided for you.  If no adapter is specified, then `localStorage` will be used by default if the browser supports it.  Otherwise, the browser will fallback to cookies.  To use one of these provided adapters, simply enter the string `"localStorage"` or `"cookieStorage"`.

> **Note:** `cookieStorage` is not implemented... yet.

```js
const session = createSession({
  ns: 'myproject',
  adapter: 'localStorage'
});
```

But what if you need to a custom storage solution like WebSQL or an external web service?  All you need for a custom adapter is an object that implements the following methods:

* `set ( name, data, opts )`
* `get ( name, opts ) -> object`
* `has ( name, opts ) -> bool`
* `clear ( name, opts )`

Then pass the object in to the adapter field.

```js
const myAdapter = {
  set (name, data) {},
  get (name) {},
  has (name) {},
  clear (name) {}
};

const session = createSession({
  ns: 'myproject',
  adapter: myAdapter
});
```

## Clearing Stored State

Finally, if you want to clear your stored session data completely, you can dispatch an action your store with the type of `CLEARED_STORED_STATE`.  The session middleware will watch for this action to invoke the adapter's `clear()` method.  You can optionally specify a custom `clearStorage` function to spy on actions and determine if the stored state should be dropped.

```js
const session = createSession({
  ns: 'myproject',
  clearStorage (action) {
    return action.type === 'DROP_SESSION_DATA';
  }
});
```

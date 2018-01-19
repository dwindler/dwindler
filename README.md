# Dwindler

Dwindler is a simple and boilerplate free [Redux](https://redux.js.org) module bundle factory for Javascript.

## Installation

`npm install dwindler redux --save`

## Motivation

Redux is great and makes your software robust but using it is a little too cumbersome and enterprisey. Dwindler easies the pain by defining type names automatically and simplifying the reducer composition.

Dwindler puts related actions, reducer and initial state inside the same entity and therefore it is inspired from the [ducks pattern](https://github.com/erikras/ducks-modular-redux). It's action creator pattern is inspired from [thunks](https://github.com/gaearon/redux-thunk).

Dwindler **does not** store the state or send events; It is designed to work alongside with Redux. This makes it possible to use the great tools and middleware created for Redux, such as [DevTools extension](https://github.com/zalmoxisus/redux-devtools-extension).

Dwindler does not take care of immutability either. I recommend to use [seamless-immutable](https://github.com/rtfeldman/seamless-immutable), but nothing stops you from using [Immutable.js](https://facebook.github.io/immutable-js/) or plain good old JS objects with [Ramda](http://ramdajs.com/), [Lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide) or spread operators (as used in the examples).

## Usage

This example is a simple **bundle** using `setState(state)` to init changes to the state. **Notice:** Because context (*this*) cannot be bound to arrow functions, action creators need to be normal functions. The ES6 shorthand form for object methods is used in these examples.

```javascript
// hello.js
import { bundle } from 'dwindler';

const hello = bundle({
  // Name is a required property. It identifies this bundle and
  // is needed to create the type names.
  name: 'hello',

  // Initial state
  state: {
    text: null
  },

  // Action creators
  actions: {
    salute(target) {
      this.setState({ text: `Hello, ${target}!` });
    }
  }
});
```

### Creating a store

The bundle itself doesn't take care of storing the state or sending events when the state changes. To make it useful we need to create a Redux store first.

```javascript
// store.js
import { createStore } from 'redux';
import hello from './hello';

const store = createStore(hello.reducer);
const actions = app.getActions(store);

actions.hello.salute('world');
store.getState(); // { text: 'Hello, world!' }
```

In this example calling `salute()` dispatches the following action under the hood:

```json
{
  "type": "hello/setState",
  "payload": {
    "text": "Hello, world!"
  }
}
```

### Reducers

`this.setState()` is probably enough if your bundle is minimalistic enough but when the complexity of the bundle grows it would be nice to distinguish state changes from each other. You can do that by dispatching actions.

Actions are dispatched with `this.dispatch(type, payload)`. The type is mapped automatically to match the bundle's type signature. All data is put into `payload` property to keep action structure uniform.

If you need to dispatch an action with exact type call `this.dispatch({ type: 'MY_ACTION' })`. This is useful for example if you want to handle API calls in middleware.

The actual change to the state is defined in `reducers` object which contains corresponding **state patches** and/or reducer functions.

State patch is an object which is merged to the current state. It is useful for static changes. For other cases you need to use a function. The function signature is `(oldState, payload) => newState`.

Dwindler composes the reducer function from these functions (and the built-in setState reducer). `this.setState(state)` is actually a shorthand for `this.dispatch('setState', state)`.

```javascript
// user.js
const user = bundle({
  name: 'user',
  state: {
    name: null,
    email: null
  },
  actions: {
    reset() {
      this.dispatch('reset');
    },
    setName(name) {
      this.dispatch('nameChanged', name);
    },
    setEmail(email) {
      this.dispatch('emailChanged', email);
    }
  },
  reducers: {
    // State patch shorthand:
    reset: { name: null, email: null },
    // Function reducers:
    nameChanged: (state, name) => { ...state, name },
    emailChanged: (state, email) => { ...state, email }
  }
});
```

Calling `setName('John Doe')` dispatches the following action:

```json
{
  "type": "user/nameChanged",
  "payload": "John Doe"
}
```

### Composition

Next we want to compose the bundles we created and create a tree. It can be done simply by creating a bundle with a **children** property. The following bundle will be our root bundle.

```javascript
const app = bundle({
  name: 'app',
  children: [user, hello]
});

const store = createStore(hello.reducer);
const actions = app.getActions(store);

actions.user.setName('Jane Doe');
actions.hello.salute('Jane');
```

As you can see the actions object is structured the same way as the bundle composition. This also affects to the form of state. Calling `store.getState()` would return following state:

```json
{
  "hello": {
    "text": "Hello, Jane!"
  },
  "user": {
    "user": "Jane Doe",
    "email": null
  }
}
```

You can compose as deep trees as you need.

### Getting the current state

To create a conditional dispatch in an action creator you need to access the state. This can be done by calling `this.getState()` and it returns the bundle's state.

If you need to access the state of another bundle you can use `this.getAppState()` which returns the whole state tree.

### Custom reducers

You can add standard Redux style reducer to the declation. It will catch all actions which are not handled by handlers in `reducers`. If you need to react to actions dispatched by other bundles you have to use this.

```javascript
const auth = bundle({
  name: 'auth',

  state: {
    token: null
  },

  reducer(state, action) {
    switch (action.type) {
      case '@@INIT':
        return { ...state, token: 'foobar' };
      default:
        return state;
    }
  }
})
```

### Composing declarations

```javascript
import { composeDeclarations } from 'dwindler';

// This is a partial declaration which can be composed to
// another declaration. It makes the bundle nameable.
const nameable = {
  state: {
    name: null
  },
  actions: {
    setName(name) {
      this.dispatch('setName', name);
    }
  },
  reducers: {
    setName: (state, name) => { ...state, name }
  }
};

const user = bundle(composeDeclarations(
  nameable,
  {
    name: 'user',
    state: {
      id: null,
    }
  },
))
```

### Using with React

Dwindler takes away the need to bind action creators to store in `connect()`. You can connect the actions in *mapStateToProps* argument.

It is still the best practise to bring the action creators in as props as it makes unit testing the component easy. **Do not** call the action creators directly from your component (e.g. `onClick={actions.logout}`).

```javascript
import React from 'react';
import { connect } from 'react-redux';
import { actions } from './store';

export const UserBadge = ({ username, logout }) => (
  <div className="UserBadge">
    {username}
    <button onClick={logout}>
      Logout
    </button>
  </div>
);

export default connect(
  state => ({
    // State
    username: state.user.username,
    // Actions
    logout: actions.user.logout,
  })
)(UserBadge);
```

### Longer example

This example includes inter-bundle communication and asynchronous multiphase action creator.

```javascript
const auth = bundle({
  name: 'auth',

  state: {
    token: null
  },

  actions: {
    login(user, password) {
      this.dispatch('login', { user, password });
    },
    logout() {
      this.dispatch('logout');
    }
  },

  reducers: {
    login: (state, token) => ({
      ...state,
      token: 'Basic ' + btoa(user + ':' + password))
    }),
    logout: { token: null }
  }
});

const users = bundle({
  name: 'users',

  state: {
    list: [],
    isLoading: false,
    error: null
  },

  actions: {
    async getUsers() {
      // Prevent user to fetch user list if there is request already ongoing.
      // getState() returns this bundle's state.
      if (this.getState().isLoading) {
        return;
      }

      // Get whole application state. We need this to read the token from the
      // auth bundle.
      const appState = this.getAppState();

      try {
        this.dispatch('started');
        const users = await api.get('users', appState.auth.token);
        this.dispatch('successful', users);
      } catch (err) {
        this.dispatch('failed', err.message);
      }
    }
  },

  reducers: {
    started: { isLoading: true },
    successful: (state, users) => ({
      ...state,
      list: users,
      isLoading: false
    }),
    failed: (state, errorMessage) => ({
      ...state,
      error: errorMessage,
      isLoading: false
    })
  }
});

const app = bundle({
  name: 'app',
  children: [auth, users]
});
```

## Writing tests

Dwindler provides `testHarness(bundle)` function to test your bundles easily. It returns an object which contains bound versions of action creators and following methods:

- `expectAction(type, payload, finalState)` defines an expected action from the action creator. If an argument is undefined/null it will not be tested so you can test actions only partially.
- `dispatch(type, payload)` dispatches an action and returns the new state.
- `getErrors()` returns an array of error strings from the validation. If there is no errors this array is empty.
- `hasErrors()` returns true if there is one or more errors.
- `actions` contains all bundle's action creators.

This example unit test uses [Tape](https://github.com/substack/tape) but you
should be able to use `testHarness()` with any JS testing framework.

```javascript
const test = require('tape');
const { bundle, testHarness } = require('dwindler');
const user = require('./user');

test('Updating user bundle state works', t => {
  const userTest = testHarness(user);

  // Expected actions
  userTest.expectAction(
    'nameChanged',  // Expected action type
    'Mary',         // Expected payload
    {               // Expected state after reducer
      name: 'Mary',
      email: null
    }
  );
  userTest.expectAction(
    'emailChanged',
    'mary@email.com',
    {
      name: 'Mary',
      email: 'mary@email.com'
    }
  );

  // Run action creators
  userTest.actions.setName('Mary');
  userTest.actions.setEmail('mary@email.com');
  t.equal(userTest.getErrors(), []); // We should not have errors

  // Test nameChanged mutation independently
  t.deepEqual(
    userTest.dispatch('nameChanged', 'John'),   // Dispatch action
    { name: 'John', email: 'mary@email.com' },  // Expected state after
    'reducers.nameChanged works'
  );

  t.end();
});
```

## MIT License

Copyright 2018 Ilkka Hänninen

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
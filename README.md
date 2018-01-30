# Dwindler

Dwindler is a simple and boilerplate free [Redux](https://redux.js.org) module bundle factory for Javascript.

## Installation

`npm install dwindler redux --save`

or

`yarn add dwindler redux`

## Motivation

Redux is great and makes your software robust but using it is a little too cumbersome and enterprisey. Dwindler easies the pain by defining type names automatically and simplifying the reducer composition.

Dwindler puts related actions, reducer and initial state inside the same entity and therefore it is inspired from the [ducks pattern](https://github.com/erikras/ducks-modular-redux). It's action creator pattern is inspired from [thunks](https://github.com/gaearon/redux-thunk).

Dwindler **does not** store the state or send events; It is designed to work alongside with Redux. This makes it possible to use the great tools and middleware created for Redux, such as [DevTools extension](https://github.com/zalmoxisus/redux-devtools-extension).

Dwindler does not take care of immutability either. I recommend to use [seamless-immutable](https://github.com/rtfeldman/seamless-immutable), but nothing stops you from using [Immutable.js](https://facebook.github.io/immutable-js/) or plain good old JS objects with [Ramda](http://ramdajs.com/), [Lodash/fp](https://github.com/lodash/lodash/wiki/FP-Guide) or spread operators (as used in the examples).

## Usage

Conceptually store is a tree structure in Dwindler. Each node is a module which contains its own properties holding the application state, action creators and reducers. You create your tree by implementing its nodes (both leaves and branches) as follows:

```javascript
const counter = {
  // Initial state
  state: {
    value: 0
  },

  // Action creators
  actions: {
    increase(amount = 1) {
      this.dispatch('increaseValue', amount);
    },
    reset() {
      this.setState({ value: 0 });
    }
  },

  // Reducers
  reducers: {
    increaseValue: (state, amount) => ({
      value: state.value + amount
    })
  }
}
```

Above we declared a node named `counter`. It has simple state with one property, one action creator to increase its value and a reducer to do the actual work.

This should be familiar if you are familiar with Redux and ducks. If you are not I recommend to read [the tutorial](https://redux.js.org/docs/basics/).

There are few differences compared to traditional Redux patterns:

* State is always an object.
  * This limitation is due to automatic type name generation.
  * As types are automatically generated you don't have to care that the action types are unique among all the reducers.
* Action creators do not return actions. The always call `this.dispatch()`.
  * Action creators are similiar to thunks but instead of receiving `dispatch` and `getState` as arguments they have those functions bound to `this`.
  * You may find this (pun intended) ugly among all the functional programming enthusiasm but this is considered option to make the code easier to write and reason.
  * Don't worry, there exists a way to easily unit test your action creators.
* `this.dispatch()` takes two arguments: `type` and `payload`.
  * This makes sure that the actions have correct shape and it is also part of the automatic type name mapping.
  * You can still dispatch standard Redux action by dispatching an action object, e.g. `dispatch({ type: 'MY_OWN_ACTION' })`

Let's assumme the `counter` we declared above isn't alone and we have created also few other nodes (in this case `user` and `posts`). Let's wrap them together to a root node:

```javascript
const root = {
  children: {
    counter,
    user,
    posts
  }
};
```

This `root` could also have state, action creators and reducers but now it is going to be a simple wrapper. `children` property defines all child nodes and those nodes could potentially have their own child nodes. This forms a tree structure. There is no limit for the depth of the tree other than usability.

Now we are ready to create our Redux store:

```javascript
import { bundle } from 'dwindler';
import { createStore } from 'redux';
import root from './root';

const app = bundle(root);
const store = createStore(app.reducer);
const actions = app.getActions(store);
```

`bundle()` takes the root node and composes a reducer function and maps type names. It returns an object which contains two functions:

* `reducer()` is the composed reducer function for `createStore`.
* `getActions()` binds store to action creators and returns a tree of bound action creators.

Now we can test our brand new store:

```javascript
// Call counter's action creator
actions.counter.increase();

// Get state and print counter's value to the console
const state = store.getState();
console.log(state.counter.value); // 1
```

As you can see the `state` and `actions` both follow the tree structure and naming. If you have some devtools installed they would have noticed the following action being dispatched:

```json
{
  "type": "counter/increaseValue",
  "payload": 1
}
```

Format for type names is `path.to.node/dispatchType`.

### External data sources

No application is an island and you most probably need to fetch data from API or other external service. Dwindler provides a standard way to inject these dependencies as services to action creators. This is a recommended way because if you need to mock your API calls for unit tests you can simply provide a mock version instead of a real thing.

Provide your services in the second argument for `bundle(root, options)` with property `services`. Inside action creators you can access the services in `this.services`.

As an example let's use something [Axios](https://github.com/axios/axios) as a simple REST API service:

```javascript
import { bundle } from 'dwindler';
import axios from 'axios';
import root from './root';

axios.defaults.baseURL = 'https://jsonplaceholder.typicode.com';

const services = {
  backend: axios
};

const app = bundle(root, { services });
```

Now we can have something like this somewhere in our action creators:

```javascript
const posts = {
  state: {
    posts: []
  },

  actions: {
    async getPosts() {
      const posts = await this.services.backend.get('/posts');
      this.dispatch('receivedPosts', posts);
    }
  },

  reducers: {
    receivedPosts: (state, posts) => ({ posts })
  }
};
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

### Unit testing

Dwindler provides `testHarness(description, options)` function to test your bundles easily. It returns an object which contains bound versions of action creators and following methods:

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
  const mockUserData = {
    name: 'mary',
    email: 'mary@email.com'
  };

  const getUserAPIMock = {
    api: {
      get() {
        return mockUserData;
      }
    }
  };

  // Create harness with mocked API which returns an user
  const userTest = testHarness(user, { services: getUserAPIMock });

  // Expected actions
  userTest.expectAction(
    'getUserStarted', // Expected action type
    null,             // null -> Don't care about payload
    {                 // Expected state after reducer
      isLoading: true,
      name: null,
      email: null
    }
  );
  userTest.expectAction(
    'getUserSuccessful',  // Expected action type
    mockUserData,         // Expected payload
    {                     // Expected state after reducer
      isLoading: false,
      ...mockUserData
    }
  );

  // Run action creators
  userTest.actions.getUser(123);
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
    state: {
      id: null,
    }
  },
))
```

### Classic redux reducers

You can add standard Redux style reducer to the declation. This is the only way to catch actions dispatched from other nodes, middlewares or possible other sources.

```javascript
const initialState = {
  name: null
};

const user = bundle({
  state: initialState,

  reducer(state, action) {
    switch (action.type) {
      case 'auth/logout':
        return initialState;
      default:
        return state;
    }
  }
})
```

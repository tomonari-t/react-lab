import { createAction, handleActions } from 'redux-actions'

function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((acc, func) => (...args) => acc(func(...args)))
}

function appliMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error('dispatching while sonctruction')
    }
  }

  const middlewareAPI = {
    getState: store.getState,
    dispatch: (...args) => dispatch(...args),
  }

  const chain = middlewares.map(middleware => middleware(middlewareAPI))
  dispatch = compose(...chain)(store.dispatch)
  return {
    ...store,
    dispatch,
  }
}

function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while(Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}

export default function createStore(reducer, preloadedState) {

  let currentReducer = reducer
  let currentState = preloadedState
  let currentListenrs = []
  let nextListners = currentListenrs
  let isDispatching = false

  function ensureCanMutateNextListeres() {
    if (nextListners === currentListenrs) {
      nextListners = currentListenrs.slice()
    }
  }

  function getState() {
    if (isDispatching) {
      throw new Error('Dipatching')
    }

    return currentState
  }

  function subscribe(listener) {
    if (typeof listener != 'function') {
      throw new Error('ow.... it is not function')
    }

    if (isDispatching) {
      throw new Error('dispatching....')
    }

    let isSubscribed = true
    ensureCanMutateNextListeres()
    nextListners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if(isDispatching) {
        throw new Error('dispatching...')
      }

      isSubscribed = false
      ensureCanMutateNextListeres()
      const index = nextListners.indexOf(listener)
      nextListners.splice(index, 1)
    }
  }

  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error('Action must be plain obj')
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    const listeners = (currentListenrs = nextListners)
    for (let i = 0; i < listeners.length; i++) {
      const listner = listeners[i]
      listner()
    }
    return action
  }

  dispatch({ type: `@@redux/INIT` })

  return {
    dispatch,
    subscribe,
    getState,
  }
}
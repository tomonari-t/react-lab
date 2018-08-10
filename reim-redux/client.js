// import { createStore, combineReducers } from 'redux'
import createStore, { combineReducers } from './redux'
import { handleActions, createAction} from 'redux-actions'

const ADD_INCREMENT = 'add'

const addNum = createAction(ADD_INCREMENT)

const reducer = handleActions({
  [ADD_INCREMENT]: (state, action) => ({
    ...state,
    num: state.num += 1,
  })
}, {
  num: 0
})
const store = createStore(reducer)
// const store = createStore(combineReducers({ reducer }))

store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
console.log(store.getState())

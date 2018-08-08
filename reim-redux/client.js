import createStore from './redux'
import { createAction } from 'redux-actions'
import { handleActions } from 'redux-actions'

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
console.log(reducer())
const store = createStore(reducer, { num : 0 })

store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
store.dispatch(addNum())
console.log(store.getState())

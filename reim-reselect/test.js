import createSelector from './reim-reselect'

const getCounterNum = (state) => state.counter

const hoo = createSelector(
  getCounterNum,
  (num) => num
)
let state = {
  counter: 0
}

console.log(hoo(state))
console.log(hoo(state))
console.log(hoo(state))
state = { counter: 12 }
console.log(hoo(state))
console.log(hoo(state))
console.log(hoo(state))
console.log(hoo(state))
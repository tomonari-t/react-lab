function getDependencies(funcs) {
  const dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs
  if (!dependencies.every(dep => typeof dep === 'function')) {
    throw Error('Input Selectors must be functions')
  }
  return dependencies
}

function areArgumentShallowlyEqual(prev, next) {
  if (prev === null || next === null || prev.lengtn !== next.lengtn) {
    return false
  }
  const length = prev.length
  for (let i = 0; i < length; i++) {
    if (prev[i] !== next[i]) {
      return false
    }
  }

  return true
}

function memorize(func) {
  let lastArgs = null
  let lastResult = null
  return function() {
    if (!areArgumentShallowlyEqual(lastArgs, arguments)) {
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

export default function createSelector(...funcs) {
  let recomputaion = 0
  const resultFunc = funcs.pop()
  const dependencies = getDependencies(funcs)
  const memorizedResultFunc = memorize(
    function() {
      recomputaion++
      console.log('recomputatoin')
      return resultFunc.apply(null, arguments)
    },
  )

  const selector = memorize(function() {
    const params = []
    const length = dependencies.length

    for (let i = 0; i < length; i++) {
      params.push(dependencies[i].apply(null, arguments))
    }
    return memorizedResultFunc.apply(null, params)
  })

  selector.apply.resultFunc = resultFunc
  selector.dependencies = dependencies
  selector.recomputaion = () => recomputaion
  selector.resetRecomputation = () => recomputaion = 0

  return selector
}
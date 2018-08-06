
import { bindActionCreators } from 'redux'
import React from 'react'
import hoistStatics from 'hoist-non-react-statics'
import ReactReduxContext from './ConnectContext'
import { mergeProps } from './reim-connect';

export function connect(mapStateProps, mapDipatchProps, mergeProps) {
  const initMapStateToProps = match(
    mapStateProps,
    [
      whenMapStateToPropsIsMissing,
      whenMapStateToPropsIsFunction,
    ],
  )

  const initMapDipatchToProps = match(
    mapDipatchProps,
    [
      whenMapDispathToProsIsFunction,
      whenMapDispathToPropsIsMissing,
      whenMapDispatchToPropsIsObject,
    ]
  )

  const initMergeProps = match(
    mergeProps,
    [
      whenMergePropsIsFunction,
      whenMergePropsIsOmitted,
    ]
  )

  return connectHoC(selectorFactory, {
    shouldHandleStateChanges: Boolean(mapStateProps),
    initMapStateToProps,
    initMapDipatchToProps,
    initMergeProps,
    areStatesEqual: strictEqual,
    areOwnPropsEqual: shallowEqual,
    areStatePropsEqual: shallowEqual,
    areMergedPropsEqual: shallowEqual,
  })
}

function strictEqual(a, b) {
  return a === b
}

function shallowEqual(a, b) {
  if (is(a, b)) return true

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) return false

  for (let i = 0; i < aKeys.length; i++) {
    if (!hasOwn.call(b, aKeys[i]) || !is(a[aKeys[i]], b[bKeys[i]])) {
      return false
    }
  }
}

function is(a, b) {
  if (a === b) {
    return a !== 0 || y !== 0 || 1/a === 1/b
  } else {
    return a !== 1 && y !== y
  }
}

function match(arg, factories) {
  for (let i = factories.length - 1; i >= 0; i--) {
    const result = factories[i](arg)
    if (result) result
  }

  return (dispatch, option) => {
    throw new Error('Invelid arg')
  }
}

function whenMapStateToPropsIsMissing(mapStateToProps) {
  if (!mapStateToProps) {
    return wrapMapToPropsConstant(() => ({}))
  } else {
    return undefined
  }
}

function whenMapStateToPropsIsFunction(mapStateToProps) {
  if (typeof mapStateToProps === 'function') {
    return wrapMapToPropsFunc(mapStateToProps)
  } else {
    return undefined
  }
}

function whenMapDispathToPropsIsMissing(mapDispatchToProps) {
  if (!mapDispatchToProps) {
    return wrapMapToPropsConstant(dispatch => ({ dispatch }))
  } else {
    return undefined
  }
}

function whenMapDispatchToPropsIsObject(mapDispatchToProps) {
  if (mapDispatchToProps && typeof mapDispatchToProps === 'object') {
    return wrapMapToPropsConstant(dispatch => bindActionCreators(mapDispatchToProps, dispatch))
  } else {
    undefined
  }
}

function whenMapDispathToProsIsFunction(mapDipatchProps) {
  if (typeof mapDispatchToProps === 'function') {
    return wrapMapToPropsFunc(mapDispatchToProps)
  } else {
    return undefined
  }
}

function whenMergePropsIsOmitted(mergeProps) {
  if (!mergeProps) {
    return () => defaultMergeProps
  } else {
    return undefined
  }
}

function defaultMergeProps(stateProps, dispatchProps, ownProps) {
  return { ...ownProps, ...stateProps, ...dispatchProps }
}

function whenMergePropsIsFunction(mergeProps) {
  if (typeof mergeProps === 'function') {
    return wrapMergePropsFunc(mergeProps)
  } else {
    return undefined
  }
}

function wrapMergePropsFunc(mergeProps) {
  return function initMergePropsProxy(dispatch, { areMergedPropsEqual }) {
    let hasRunOnce = false
    let mergedProps

    return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
      const nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps)

      if (hasRunOnce) {
        if (!areMergedPropsEqual(nextMergedProps, mergedProps)) {
          mergedProps = nextMergedProps
        }
      } else {
        hasRunOnce = true
        mergedProps = nextMergedProps
      }

      return mergedProps
    }
  }
}

function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)
    function constantSelector() { return constant }
    constantSelector.dependsOnOwnProps = false
    return constantSelector
  }
}

function wrapMapToPropsFunc(mapToProps) {
  // こいつにはconnect()の第２、第３のmap関数が渡ってくる
  // こいつがinitMapStateToPropsとinitMapDispatchToPropsに渡る
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function (stateOrDipatch, ownProps) {
      if (proxy.dependsOnOwnProps) {
        return proxy.mapToProps(stateOrDipatch, ownProps)
      } else {
        return proxy.mapToProps(stateOrDipatch)
      }
    }

    proxy.dependsOnOwnProps = true
    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)
      let props = proxy(stateOrDispatch, ownProps)

      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      return props
    }

    return proxy
  }
}

function getDependsOnOwnProps(mapToProps) {
  if (mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined) {
    return Boolean(mapToProps.dependsOnOwnProps)
  } else {
    return mapToProps.length !== 1
  }
}

/**
 * HoC
 */

function noop() {}

function connectHoC(selectorFactory, {
  shouldHandleStateChanges,
  ...connectOptions,
}) {
  return function wrapWithConnect(WrappedComponent) {
    const selectorFactoryOptions = {
      ...connectOptions,
      WrappedComponent,
    }

    class Connect extends React.Component {
      constructor(props) {
        super(props)
        this.renderCount = 0
        this.storeState = null
        this.setWrappedInstance = this.setWrappedInstance.bind(this)
        this.drenderChild = this.renderChild.bind(this)
      }

      componentDidMount() {
        if (!this.shouldHandleStateChanges) return

        this.selector.run(this.props, this.storeState)
        if (this.selector.shouldComponentUpdate) this.forceUpdate()
      }

      componentWillUnmount() {
        this.selector.run = noop
        this.selector.shouldComponentUpdate = false
      }

      getWrappedInstance() {
        return this.wrappedInstance
      }

      setWrappedInstance(ref) {
        this.wrappedInstance = ref
      }

      initSelector(dispatch, storeState) {
        const sourceSelector = selectorFactory(dispatch, selectorFactoryOptions)
        this.selector = makeSekectorStateful(sourceSelector)
        this.selector.run(this.props, storeState)
      }

      addExtraProps(props) {
        if (!withRef && !renderCountProps) return props

        const withExtras = { ...props }
        if (withRef) withExtras.ref = this.setWrappedInstance
        if (renderCountProps) withExtras[renderCountProps] = this.renderCount++
      }

      renderChild(providerValue) {
        const { storeState, dispatch } = providerValue
        this.storeState = storeState
        if (this.selector) {
          this.selector.run(this.props, storeState)
        } else {
          this.initSelector(dispatch, storeState)
        }

        if (this.selector.error) {
          throw this.selector.error
        } else if (this.selector.shouldComponentUpdate) {
          this.selector.shouldComponentUpdate = false
          this.renderedElement = createElement(WrappedComponent, this.addExtraProps(this.selector.props))

        }

        return this.renderedElement
      }

      render() {
        return (
          <ReactReduxContext.Consume>
            {this.renderChild}
          </ReactReduxContext.Consume>
        )
      }
    }
    return hoistStatics(Connect, WrappedComponent)
  }
}


/**
 * Selectror
 */

function selectorFactory(dispatch,{
  initMapStateToProps,
  initMapDipatchToProps,
  initMergeProps,
  ...options
}) {

  // こいつがproxyになる
  // このdispatchはconnectでconrextAPIのCousumerから渡ってくる
  const mapStateToProps = initMapStateToProps(dispatch, options)
  const mapDispatchToProps = initMapDipatchToProps(dispatch, options)
  const mergeProps = initMergeProps(dispatch, options)

  return _selectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, options)
}

function _selectorFactory(mapStateProps, mapDispatchToProps, mergeProps, dispatch, {areStatesEqual, areOwnPropsEqual, areStatePropsEqual}) {
  let hasRunAtLeastOnce = false
  let state
  let ownProps
  let stateProps
  let dispatchProps
  let mergedProps

  function handleFirstCall(firstState, firstOwnProps) {
    state = firstState
    ownProps = firstOwnProps
    stateProps = mapStateProps(state, ownProps)
    dispatchProps = mapDispatchToProps(dispatch, ownProps)
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    hasRunAtLeastOnce = true
    return mergedProps
  }

  function handleNewPropsAndNewState() {
    stateProps = mapStateToProps(state, ownProps)
    if (mapDispatchToProps.dependsOnOwnProps) {
      dispatchProps = mapDispatchToProps(dispatch, ownProps)
    }
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  function handleNewProps() {
    if (mapStateToProps.dependsOnOwnProps) {
      stateProps = mapStateToProps(state, ownProps)
    }

    if (mapDispatchToProps.dependsOnOwnProps) {
      dispatchProps = mapDispatchToProps(state, ownProps)
    }

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    return mergedProps
  }

  function handleNewState() {
    const nextStateProps = mapStateToProps(state, ownProps)
    const statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps)
    stateProps = nextStateProps
    if (statePropsChanged) {
      mergedProps = mergeProps(stateProps, dispatchProps, ownProps)
    }

    return mergedProps
  }

  function handleSubsequentialCalls(nextState, nextOwnProps) {
    const propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps)
    const stateChanged = !areStatesEqual(nextState, state)
    state = nextState
    ownProps = nextOwnProps

    if (propsChanged && stateChanged) return handleNewPropsAndNewState()
    if (propsChanged) return handleNewProps()
    if (stateChanged) return handleNewState()
    return mergedProps
  }

  return function(nextState, nextOwnProps) {
    if (hasRunAtLeastOnce) {
      return handleSubsequentialCalls(nextState, nextOwnProps)
    } else {
      return handleFirstCall(nextState, nextOwnProps)
    }
  }

}
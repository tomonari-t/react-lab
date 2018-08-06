function connect(mapStateToProps, mapDispatchToProps) {
  return (WrappedComponent) => {
    return class extends React.Component {
      render() {
        return <WrappedComponent
          {...this.props}
          {...mapStateToProps()}
          {...mapDispatchToProps()}
          />
      }

      componentDidMount() {
        this.unsbscribe = store.subscribe(this.handleChange.bind(this))
      }

      componentWillUnmount() {
        this.unsbscribe()
      }

      handleChange() {
        this.forceUpdate()
      }

    }
  }
}

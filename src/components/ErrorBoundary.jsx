import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for debugging; keeps UI alive instead of white screen.
    console.error("UI error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      return Fallback ? <Fallback error={this.state.error} /> : null;
    }
    return this.props.children;
  }
}

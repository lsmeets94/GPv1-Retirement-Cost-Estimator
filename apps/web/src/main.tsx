import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected application error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="panel readable">
            <h1>Something went wrong</h1>
            <p>The estimator hit an unexpected browser error. Refresh the page to recover; saved portfolio data remains in this browser unless you clear it.</p>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </FluentProvider>
  </React.StrictMode>
);

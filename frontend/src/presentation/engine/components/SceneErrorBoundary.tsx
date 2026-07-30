import { Component, type ReactNode } from "react";

export interface SceneErrorBoundaryProps {
  readonly children: ReactNode;
  /** Included in the logged error message so it's obvious which scene failed. */
  readonly sceneName: string;
}

interface SceneErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * This project had no error boundary anywhere before this. Without
 * one, a render-time exception in any child (vegetation scattering, a
 * puzzle component, anything) either crashes the whole React tree or
 * fails silently depending on exactly where it occurs - there was no
 * way to see what actually went wrong from outside a live browser.
 * This makes failures loud (console.error with the real stack) and
 * contained (only this subtree stops rendering, not everything else
 * sharing the same Canvas).
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  override state: SceneErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }): void {
    console.error(
      `[SceneErrorBoundary:${this.props.sceneName}] A render error was caught. The scene stopped rendering at this point:`,
      error,
      errorInfo.componentStack
    );
  }

  override render(): ReactNode {
    if (this.state.error) {
      return null;
    }
    return this.props.children;
  }
}

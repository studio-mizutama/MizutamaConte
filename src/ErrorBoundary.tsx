import React from 'react';

interface Props {
  /** error と「内部 error state をリセットする関数」を受けて fallback UI を返す */
  fallback: (error: Error, reset: () => void) => React.ReactNode;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/** 描画中の未捕捉例外を捕まえ、白画面化を防いで復帰可能な fallback を表示する汎用境界。
 *  入力バリデーションを擦り抜けた未知の壊れ方に対する最後の安全網。 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 復帰可能なので致命扱いしない。診断用にログだけ残す。
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): React.ReactNode {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}

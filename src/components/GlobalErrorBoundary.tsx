import React from 'react';

interface GlobalErrorBoundaryProps { children: React.ReactNode; }
interface GlobalErrorBoundaryState { hasError: boolean; errorId: string | null; errorMessage: string | null; componentStack: string | null; }

/** Prevents a single rendering failure from taking down the entire café UI. */
export class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = { hasError: false, errorId: null, errorMessage: null, componentStack: null };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return {
      hasError: true,
      errorId: `UI-${Date.now().toString(36).toUpperCase()}`,
      errorMessage: error?.message || 'Unknown client-side error',
      componentStack: null
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Bytes & Brew] Unhandled UI error', { error, componentStack: info.componentStack });
    this.setState({ componentStack: info.componentStack || null });
  }

  private recover = () => {
    this.setState({ hasError: false, errorId: null, errorMessage: null, componentStack: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <section className="w-full max-w-2xl rounded-3xl border border-red-500/20 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-red-400 text-2xl">!</div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Arena system recovery</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Something went off-grid</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">The interface hit an unexpected client-side error. Your server-side café data is unaffected.</p>
          {this.state.errorId && <p className="mt-4 font-mono text-[10px] text-white/25">Reference: {this.state.errorId}</p>}
          {this.state.errorMessage && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-2">Client error</p>
              <pre className="whitespace-pre-wrap break-words text-xs font-mono text-red-100">{this.state.errorMessage}</pre>
            </div>
          )}
          {this.state.componentStack && (
            <details className="mt-3 text-left">
              <summary className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-white/35">Component stack</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-3 text-[9px] leading-4 text-white/35">{this.state.componentStack}</pre>
            </details>
          )}
          <button onClick={this.recover} className="mt-7 rounded-xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-500 active:scale-95">Reload Arena</button>
        </section>
      </div>
    );
  }
}

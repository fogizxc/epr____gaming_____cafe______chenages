import React from 'react';

interface GlobalErrorBoundaryProps { children: React.ReactNode; }
interface GlobalErrorBoundaryState { hasError: boolean; errorId: string | null; }

/** Prevents a single rendering failure from taking down the entire café UI. */
export class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = { hasError: false, errorId: null };

  static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true, errorId: `UI-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Bytes & Brew] Unhandled UI error', { error, componentStack: info.componentStack });
  }

  private recover = () => {
    this.setState({ hasError: false, errorId: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <section className="w-full max-w-xl rounded-3xl border border-red-500/20 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/50">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-red-400 text-2xl">!</div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Arena system recovery</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Something went off-grid</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">The interface hit an unexpected error. Your server-side café data is unaffected. Reload the arena to recover.</p>
          {this.state.errorId && <p className="mt-4 font-mono text-[10px] text-white/25">Reference: {this.state.errorId}</p>}
          <button onClick={this.recover} className="mt-7 rounded-xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-red-500 active:scale-95">Reload Arena</button>
        </section>
      </div>
    );
  }
}

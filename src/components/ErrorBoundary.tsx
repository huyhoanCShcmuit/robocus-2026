import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-slate-900 border-2 border-rose-500/50 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-center">
              <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/30">
                <AlertTriangle className="w-12 h-12 text-rose-400 animate-bounce" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-orbitron text-rose-400 uppercase tracking-wider">
                ĐÃ XẢY RA LỖI GIAO DIỆN
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {this.state.error?.message || 'Lỗi không xác định trong quá trình xử lý.'}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-rose-500 hover:bg-rose-600 text-slate-950 font-orbitron font-black text-sm py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>TẢI LẠI TRANG</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

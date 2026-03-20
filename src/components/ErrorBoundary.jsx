import React, { Component } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-6">
            <AlertOctagon size={48} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-2xl font-serif text-primary mb-3">Something went wrong</h1>
          
          <p className="text-sm text-gray-500 mb-8 max-w-sm">
            We encountered an unexpected error. Your data is safe in local storage, but the app needs to be reloaded.
          </p>
          
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium shadow-sm hover:bg-accent/90 transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { useState } from 'react';
import { Layers, ArrowLeft, Lock, User as UserIcon, ArrowRight, AlertCircle, Globe, Shield, Sparkles, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password?: string) => Promise<void>;
  onSwitchToCustomerPortal?: () => void;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToCustomerPortal, onBackToHome }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between antialiased">
      {/* Top Navbar with App Title & Top-Right Admin / Customer Login Toggle */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                Mutual fund (SIF) and NPS scheme return calculating site
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Mutual Fund (SIF) Compounding & NPS Pension Platform
              </p>
            </div>
          </div>

          {/* Top Right: Admin Login & Customer Login Controls */}
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Back to Home Screen"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs flex items-center gap-1.5 border border-slate-900 cursor-default"
              title="You are currently on the Admin Login portal"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToCustomerPortal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Switch to Customer Login & Investment Return Calculator"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Login Form Container */}
      <div className="flex-1 flex flex-col justify-center py-8 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin & Staff Portal Access</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mutual fund (SIF) and NPS scheme return calculating site
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Single Sign-On Authentication for Authorized Officers
            </p>
          </div>

          {/* White Card */}
          <div className="bg-white py-7 px-6 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
            <div className="border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Admin Credentials Sign-In
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sign in with Head, Regional Incharge, or Area Incharge User ID.
                </p>
              </div>
              <LogIn className="w-4 h-4 text-slate-400" />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Admin User ID / Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Admin User ID (e.g. JPM_MF)"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Access Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer mt-3"
              >
                <span>{loading ? 'Authenticating Admin...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </form>

            {/* Quick Switch to Customer Portal */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
              <span className="text-[11px] text-slate-500 block font-medium">
                Are you an investor looking to create an account or calculate scheme returns?
              </span>
              <button
                type="button"
                onClick={onSwitchToCustomerPortal}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Go to Customer Login & Scheme Return Calculator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        Mutual fund (SIF) and NPS scheme return calculating site • Secure System
      </footer>
    </div>
  );
};

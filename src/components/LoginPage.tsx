import React, { useState } from 'react';
import { Layers, Lock, User as UserIcon, ArrowRight, AlertCircle, Globe, ExternalLink, Copy, Check } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password?: string) => Promise<void>;
  onSwitchToCustomerPortal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToCustomerPortal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Windows Enterprise System Style Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold mx-auto shadow-md border border-slate-700">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            Lead Information
          </h1>
          <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Online Management Portal
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5">
              lead-information-mf-sir.vercel.app
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* White Professional Windows Card */}
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl rounded-xl border border-slate-200">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Single Sign-On Portal (One Login)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized staff credentials to sign in.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                User ID / Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter User ID (e.g. JPM_MF)"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Lead Information'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
            <span className="text-[11px] text-slate-500 block font-medium">
              Are you an investor looking to create an account or calculate returns?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToCustomerPortal) {
                    onSwitchToCustomerPortal();
                  }
                }}
                className="flex-1 py-2 px-3 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Open Customer Web Portal (MF-SIF-investment-calculator.vercel.app)"
              >
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Open Customer Web Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://MF-SIF-investment-calculator.vercel.app');
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                title="Copy Customer Sub-Domain Link (MF-SIF-investment-calculator.vercel.app)"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
            {copiedLink && (
              <p className="text-[10px] text-emerald-600 font-bold">
                Copied: https://MF-SIF-investment-calculator.vercel.app
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-mono">
              Sub-Domain: MF-SIF-investment-calculator.vercel.app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

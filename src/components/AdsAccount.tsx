import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LogIn, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { SiteCustomer } from '../types';
import { siteCustomerStorage } from '../services/siteCustomerStorage';
import { newVerificationCode, normalizeCode } from '../utils/siteAuth';

const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';
const Err: React.FC<{ msg: string | null }> = ({ msg }) =>
  msg ? (
    <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
      <AlertCircle className="w-4 h-4 shrink-0" /> {msg}
    </p>
  ) : null;

const CODE_SECONDS = 30;

/** The code is made in the browser, shown for 30 seconds, then must be regenerated. No e-mail / SMS service is used. */
export const VerifyPanel: React.FC<{ customer: SiteCustomer; onVerified: (c: SiteCustomer) => void }> = ({ customer, onVerified }) => {
  const [shown, setShown] = useState(() => newVerificationCode());
  const [left, setLeft] = useState(CODE_SECONDS);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  const regenerate = () => {
    setShown(newVerificationCode());
    setLeft(CODE_SECONDS);
    setCode('');
    setError(null);
  };
  const expired = left <= 0;

  const submit = async () => {
    setError(null);
    if (expired) return setError('The code has expired. Tap Regenerate.');
    if (normalizeCode(code) !== normalizeCode(shown)) return setError('The code does not match. Type the code shown above.');
    setBusy(true);
    try {
      onVerified(await siteCustomerStorage.markSelfVerified(customer.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4" /> Verify your account
      </div>
      <p className="text-sm text-slate-700">
        Hello <b>{customer.fullName}</b>. Type the code shown below to verify your account.
      </p>
      <div className={`rounded-xl border px-4 py-3 text-center ${expired ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
        <p data-testid="verify-code" className={`font-mono text-2xl font-extrabold tracking-widest ${expired ? 'text-slate-400 line-through' : 'text-blue-800'}`}>{shown}</p>
        <p data-testid="verify-status" className={`mt-1 text-xs font-bold ${expired ? 'text-rose-700' : 'text-emerald-700'}`}>
          {expired ? 'Code expired' : `Valid for ${left} second${left === 1 ? '' : 's'}`}
        </p>
      </div>
      <Err msg={error} />
      <label className={lbl}>
        Enter the code
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" maxLength={9} autoComplete="off" className={`mt-1 ${input} tracking-widest font-mono`} />
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={busy || expired || code.replace(/[^A-Za-z0-9]/g, '').length < 8} onClick={submit} className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
          <KeyRound className="w-4 h-4" /> Verify
        </button>
        <button type="button" onClick={regenerate} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer ${expired ? 'bg-amber-500 text-white' : 'border border-slate-300'}`}>
          <RefreshCw className="w-4 h-4" /> Regenerate
        </button>
      </div>
    </div>
  );
};

/** Login / Create account for the advertising website */
export const AdsAccount: React.FC<{ onLogin: (c: SiteCustomer) => void; message?: string }> = ({ onLogin, message }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [idf, setIdf] = useState('');
  const [pw, setPw] = useState('');
  const [f, setF] = useState({ fullName: '', mobile: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<SiteCustomer>) => {
    setError(null);
    setBusy(true);
    try {
      onLogin(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 max-w-md mx-auto">
      {message && <p className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">{message}</p>}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-sm font-bold">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null); }} className={`py-2 rounded-lg cursor-pointer ${mode === m ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'}`}>
            {m === 'login' ? 'Login' : 'Create account'}
          </button>
        ))}
      </div>
      <Err msg={error} />
      {mode === 'login' ? (
        <form onSubmit={(e) => { e.preventDefault(); run(() => siteCustomerStorage.login(idf, pw)); }} className="space-y-3">
          <label className={lbl}>
            E-mail ID or mobile number
            <input value={idf} onChange={(e) => setIdf(e.target.value)} autoComplete="username" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" className={`mt-1 ${input}`} />
          </label>
          <button type="submit" disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
            <LogIn className="w-4 h-4" /> {busy ? 'Please wait...' : 'Login'}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); run(() => siteCustomerStorage.register(f)); }} className="space-y-3">
          <label className={lbl}>
            Full name
            <input value={f.fullName} maxLength={100} onChange={(e) => setF({ ...f, fullName: e.target.value })} autoComplete="name" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Mobile number
            <input value={f.mobile} inputMode="tel" maxLength={16} onChange={(e) => setF({ ...f, mobile: e.target.value })} autoComplete="tel" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            E-mail ID
            <input type="email" value={f.email} maxLength={120} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Password (at least 8 characters)
            <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Confirm password
            <input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" className={`mt-1 ${input}`} />
          </label>
          <p className="text-[11px] text-slate-500 flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> After you create the account, a verification code is shown on the page. It is valid for 30 seconds and can be regenerated.</p>
          <button type="submit" disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
            <UserPlus className="w-4 h-4" /> {busy ? 'Please wait...' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  );
};

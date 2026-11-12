import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Hash, Lock, X, KeyRound } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';
import { PIN_RULE, PIN_HELP } from '../utils/pin';

const input =
  'w-full pl-8 pr-3 py-2 text-sm tracking-[0.3em] border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono';
const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

const Msg: React.FC<{ ok?: boolean; text: string }> = ({ ok, text }) => (
  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
    {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
    <span>{text}</span>
  </div>
);

const PinField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
    {label}
    <div className="relative mt-1">
      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
      <input type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={value} placeholder={placeholder}
        onChange={(e) => onChange(digits(e.target.value))} className={input} />
    </div>
  </label>
);

/** The signed-in user sets, changes or removes their own login PIN (their password confirms it is them). */
export const OwnPinForm: React.FC<{ currentUser: User; onSaved: (u: User, message: string) => void; onClose: () => void }> = ({ currentUser, onSaved, onClose }) => {
  const [hasPin, setHasPin] = useState(!!currentUser.hasPin);
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  const run = async (newPin: string | null) => {
    setMsg(null);
    if (!password) return setMsg({ text: 'Enter your current password to confirm it is you.' });
    if (newPin !== null) {
      if (!PIN_RULE.test(newPin)) return setMsg({ text: PIN_HELP });
      if (newPin !== pin2) return setMsg({ text: 'The two PINs do not match.' });
    }
    setBusy(true);
    try {
      const u = await apiService.setOwnPin(currentUser.id, password, newPin);
      setHasPin(newPin !== null);
      setPassword('');
      setPin('');
      setPin2('');
      const text = newPin === null ? 'Your login PIN has been removed.' : 'Your login PIN is saved. You can now sign in with your username and PIN.';
      setMsg({ ok: true, text });
      onSaved(u, text);
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Could not save the PIN.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="p-6 space-y-4">
        {msg && <Msg {...msg} />}
        <p className="text-[11px] text-slate-500">
          {hasPin ? 'A login PIN is set for your account. You can change or remove it here.' : 'Set a PIN of 4 to 6 digits to sign in faster with your username and PIN.'} Only you
          and the Head Incharge can change your PIN.
        </p>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Current password <span className="text-rose-500">*</span>
          <div className="relative mt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Confirm it is you"
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono" />
          </div>
        </label>
        <PinField label={hasPin ? 'New PIN' : 'PIN'} value={pin} onChange={setPin} placeholder="4 to 6 digits" />
        <PinField label="Type the PIN again" value={pin2} onChange={setPin2} />
      </div>
      <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        {hasPin ? (
          <button type="button" disabled={busy} onClick={() => run(null)} className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-md">
            Remove PIN
          </button>
        ) : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md">Close</button>
          <button type="button" disabled={busy || !pin} onClick={() => run(pin)} className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-md shadow-xs">
            {busy ? 'Saving...' : hasPin ? 'Change PIN' : 'Save PIN'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Head Incharge sets, resets or removes the login PIN of another admin user. */
export const HeadPinModal: React.FC<{ head: User; user: User; onClose: () => void; onSaved: (u: User, message: string) => void }> = ({ head, user, onClose, onSaved }) => {
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const run = async (newPin: string | null) => {
    setMsg(null);
    if (newPin !== null) {
      if (!PIN_RULE.test(newPin)) return setMsg({ text: PIN_HELP });
      if (newPin !== pin2) return setMsg({ text: 'The two PINs do not match.' });
    }
    setBusy(true);
    try {
      const u = await apiService.setUserPinByHead(head, user.id, newPin);
      onSaved(u, newPin === null ? `Login PIN removed for ${user.name}.` : `New login PIN saved for ${user.name}. Tell them the PIN; they can change it themselves.`);
      onClose();
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Could not save the PIN.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center modal-safe p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden" role="dialog" aria-modal="true">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Login PIN for {user.name}</h2>
              <p className="text-[11px] text-slate-300">@{user.username} · {user.hasPin ? 'PIN is set' : 'No PIN yet'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {msg && <Msg {...msg} />}
          <p className="text-[11px] text-slate-500">
            As Head Incharge you can set a new PIN (for example when it is forgotten) or remove it. The user can change it again under Password &amp; PIN.
            {user.pinSetAt && ` Last set on ${new Date(user.pinSetAt).toLocaleString('en-IN')} by ${user.pinSetBy || 'admin'}.`}
          </p>
          <PinField label="New PIN" value={pin} onChange={setPin} placeholder="4 to 6 digits" />
          <PinField label="Type the PIN again" value={pin2} onChange={setPin2} />
        </div>
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          {user.hasPin ? (
            <button type="button" disabled={busy} onClick={() => (confirmRemove ? run(null) : setConfirmRemove(true))}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-md">
              {confirmRemove ? 'Confirm remove' : 'Remove PIN'}
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-md">Cancel</button>
            <button type="button" disabled={busy || !pin} onClick={() => run(pin)} className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-md shadow-xs">
              {busy ? 'Saving...' : 'Save PIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

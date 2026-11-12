import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';

interface Props {
  currentUser: User;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

/** Sets the PIN that opens "Staff login" in the Investment Business game (web, Windows, Mac, Android, iPhone). */
export const GameStaffPin: React.FC<Props> = ({ currentUser, onNotify }) => {
  const [info, setInfo] = useState<{ set: boolean; updatedAt?: string; updatedBy?: string } | null>(null);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<SaveProblem | null>(null);

  useEffect(() => {
    apiService.getGameStaffPin().then(setInfo);
  }, []);

  const save = async () => {
    setError(null);
    setProblem(null);
    if (!/^[0-9]{4,8}$/.test(pin)) return setError('Enter a PIN of 4 to 8 digits.');
    if (pin !== pin2) return setError('The two PINs do not match.');
    setSaving(true);
    try {
      const r = await apiService.saveGameStaffPin(pin, `${currentUser.name} (${currentUser.designation})`);
      setInfo({ set: true, ...r });
      setPin('');
      setPin2('');
      onNotify('Game staff PIN saved. Use it in Staff login on the game.', 'success');
    } catch (e) {
      setProblem(describeSaveError(e, 'The game staff PIN'));
    } finally {
      setSaving(false);
    }
  };

  const field = 'mt-1 w-full px-3 py-2 text-sm font-bold tracking-widest text-slate-900 border border-slate-300 rounded-lg';
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-indigo-600" />
        <p className="text-sm font-bold text-slate-900">Investment Business game: staff PIN</p>
      </div>
      <p className="text-[11px] text-slate-500">
        Staff enter this PIN in <b>Staff login</b> on the game to see and download the players' details. It works on the game website and on the
        Windows, Mac, Android and iPhone apps (they pick up a new PIN the next time they are online).{' '}
        {info === null
          ? 'Checking…'
          : info.set
            ? `Last changed by ${info.updatedBy || 'admin'} on ${info.updatedAt ? new Date(info.updatedAt).toLocaleString('en-IN') : '-'}.`
            : 'No PIN has been set here yet, so the game still uses the starting PIN 2026. Set your own PIN now.'}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          New PIN (4 to 8 digits)
          <input type={show ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={8} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={field} />
        </label>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Type the PIN again
          <input type={show ? 'text' : 'password'} inputMode="numeric" autoComplete="new-password" maxLength={8} value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))} className={field} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={saving || !pin || !pin2}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">
          {saving ? 'Saving...' : 'Save PIN'}
        </button>
        <button type="button" onClick={() => setShow((s) => !s)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {problem ? (
        <SaveErrorNotice problem={problem} />
      ) : (
        error && (
          <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )
      )}
      <p className="text-[11px] text-slate-400">The PIN itself is not stored; only a scrambled copy is saved, so nobody can read it back. If it is forgotten, set a new one here.</p>
    </div>
  );
};

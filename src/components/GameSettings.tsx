import React, { useEffect, useState } from 'react';
import { Dices, Disc3, Gamepad2 } from 'lucide-react';
import { User } from '../types';
import { apiService } from '../services/api';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';

type Mover = 'dice' | 'spinner';

/** Head Incharge only: chooses how players move in the Investment Business game (web and all apps). */
export const GameSettings: React.FC<{ currentUser: User; onNotify: (m: string, t?: 'success' | 'error') => void }> = ({ currentUser, onNotify }) => {
  const [saved, setSaved] = useState<{ mover: Mover; updatedAt?: string; updatedBy?: string } | null>(null);
  const [mover, setMover] = useState<Mover>('dice');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<SaveProblem | null>(null);

  useEffect(() => {
    apiService.getGameSettings().then((s) => {
      setSaved(s);
      setMover(s.mover);
    });
  }, []);

  if (currentUser.role !== 'head') return null;

  const save = async () => {
    setProblem(null);
    setBusy(true);
    try {
      const s = await apiService.saveGameSettings(currentUser, mover);
      setSaved(s);
      onNotify(`Game now uses the ${mover === 'spinner' ? 'spinning wheel' : 'dice'}. Players see it the next time they open the game.`, 'success');
    } catch (e) {
      setProblem(describeSaveError(e, 'The game settings'));
    } finally {
      setBusy(false);
    }
  };

  const options: { v: Mover; title: string; help: string; icon: React.ReactNode }[] = [
    { v: 'dice', title: 'Dice', help: 'Players press Roll dice. A number from 1 to 6 appears.', icon: <Dices className="w-5 h-5" /> },
    { v: 'spinner', title: 'Spinning wheel', help: 'Players press Spin. A colourful wheel numbered 1 to 6 spins and stops under the arrow.', icon: <Disc3 className="w-5 h-5" /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-4 h-4 text-indigo-600" />
        <p className="text-sm font-bold text-slate-900">Investment Business game: how players move</p>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Head only</span>
      </div>
      <p className="text-[11px] text-slate-500">
        Applies to the game website and the Windows, Mac, Android and iPhone apps (they pick it up the next time they are online). The Chance cards work the same way with
        either: the card number is the number thrown or spun.
        {saved?.updatedAt && ` Last changed by ${saved.updatedBy || 'Head'} on ${new Date(saved.updatedAt).toLocaleString('en-IN')}.`}
      </p>
      <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="How players move">
        {options.map((o) => (
          <button key={o.v} type="button" role="radio" aria-checked={mover === o.v} onClick={() => setMover(o.v)}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex gap-3 ${mover === o.v ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mover === o.v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{o.icon}</span>
            <span>
              <span className="block text-sm font-bold text-slate-900">{o.title}{saved?.mover === o.v ? ' (in use)' : ''}</span>
              <span className="block text-[11px] text-slate-500">{o.help}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" onClick={save} disabled={busy || !saved || saved.mover === mover}
        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">
        {busy ? 'Saving...' : 'Save game setting'}
      </button>
      {problem && <SaveErrorNotice problem={problem} />}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, MapPin, UserPlus } from 'lucide-react';
import { AwarenessProgram } from '../types';
import { apiService } from '../services/api';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { formatDateTime } from '../utils/dateTime';

const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';

/** Separate registration form of one awareness session (opened by its own link) */
export const SessionRegister: React.FC<{ programId: string; onBack: () => void }> = ({ programId, onBack }) => {
  const [program, setProgram] = useState<AwarenessProgram | null | undefined>(undefined);
  const [f, setF] = useState({ attendeeType: 'customer' as 'customer' | 'member', name: '', mobile: '', email: '', city: '', guests: 0, note: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiService
      .getAwarenessPrograms()
      .then((l: AwarenessProgram[]) => setProgram(l.find((p) => p.id === programId && p.isActive) ?? null))
      .catch(() => setProgram(null));
  }, [programId]);

  if (program === undefined) return <p className="text-xs text-slate-400 text-center py-8">Loading...</p>;
  if (!program)
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
        <p className="text-sm text-slate-700">This session was not found or is no longer open for registration.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold cursor-pointer">See all sessions</button>
      </div>
    );

  const over = new Date(program.endsAt || program.startsAt).getTime() + 3 * 3600000 < Date.now();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sessionRegStorage.register(program, f);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1.5">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Session registration</p>
        <h1 className="text-lg font-black text-slate-900 leading-snug">{program.title}</h1>
        <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-700"><CalendarDays className="w-3.5 h-3.5" /> {formatDateTime(program.startsAt)}</p>
        {program.mode === 'offline' && program.venue && <p className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold"><MapPin className="w-3.5 h-3.5" /> {program.venue}</p>}
        {program.mode === 'online' && <p className="text-xs text-slate-600 font-semibold">Online session. The joining link is shared on the Awareness Sessions page.</p>}
      </div>
      {over ? (
        <p className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-semibold text-amber-800">This session is over. Registration is closed.</p>
      ) : done ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-emerald-900">Thank you {f.name}. You are registered.</p>
          <button onClick={onBack} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold cursor-pointer">Back to sessions</button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          {error && (
            <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <label className={lbl}>Full name<input value={f.name} maxLength={100} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" className={`mt-1 ${input}`} /></label>
          <label className={lbl}>Mobile number<input value={f.mobile} inputMode="tel" maxLength={16} onChange={(e) => setF({ ...f, mobile: e.target.value })} autoComplete="tel" className={`mt-1 ${input}`} /></label>
          <label className={lbl}>E-mail ID (optional)<input type="email" value={f.email} maxLength={120} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" className={`mt-1 ${input}`} /></label>
          <label className={lbl}>City (optional)<input value={f.city} maxLength={60} onChange={(e) => setF({ ...f, city: e.target.value })} className={`mt-1 ${input}`} /></label>
          <label className={lbl}>People coming with you<input type="number" min={0} max={10} value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })} className={`mt-1 ${input}`} /></label>
          <label className={lbl}>Message (optional)<textarea value={f.note} maxLength={500} rows={2} onChange={(e) => setF({ ...f, note: e.target.value })} className={`mt-1 ${input}`} /></label>
          <button type="submit" disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
            <UserPlus className="w-4 h-4" /> {busy ? 'Please wait...' : 'Register'}
          </button>
        </form>
      )}
    </section>
  );
};

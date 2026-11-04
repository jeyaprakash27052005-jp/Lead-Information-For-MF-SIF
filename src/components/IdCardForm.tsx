import React, { useState } from 'react';
import { Download, IdCard } from 'lucide-react';
import { AwarenessProgram, SessionRegistration } from '../types';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { downloadCard, smallPhoto } from '../utils/idCard';

const input = 'w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';

export const CardForm: React.FC<{ r: SessionRegistration; p: AwarenessProgram; onSaved: () => void }> = ({ r, p, onSaved }) => {
  const [f, setF] = useState({ cardName: r.cardName || r.name, cardOccupation: r.cardOccupation || '', cardCity: r.cardCity || r.city || '' });
  const [photo, setPhoto] = useState<string | undefined>(r.cardPhoto);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = !!r.cardName;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.cardName.trim().length < 2) return setError('Type the name for the ID card.');
    setBusy(true);
    try {
      await sessionRegStorage.saveCard(r.id, { cardName: f.cardName.trim(), cardOccupation: f.cardOccupation.trim(), cardCity: f.cardCity.trim(), cardPhoto: photo });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-3 border-t border-slate-100 pt-3 space-y-2">
      <p className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5"><IdCard className="w-4 h-4" /> ID card</p>
      {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
      <label className={lbl}>Name on card<input value={f.cardName} maxLength={60} onChange={(e) => setF({ ...f, cardName: e.target.value })} className={`mt-1 ${input}`} /></label>
      <label className={lbl}>Occupation / company<input value={f.cardOccupation} maxLength={60} onChange={(e) => setF({ ...f, cardOccupation: e.target.value })} className={`mt-1 ${input}`} /></label>
      <label className={lbl}>City<input value={f.cardCity} maxLength={60} onChange={(e) => setF({ ...f, cardCity: e.target.value })} className={`mt-1 ${input}`} /></label>
      <div className="flex items-center gap-3">
        {photo && <img src={photo} alt="Your photo" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />}
        <label className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer">
          {photo ? 'Change photo' : 'Upload photo'}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && smallPhoto(e.target.files[0]).then(setPhoto).catch((er) => setError(er.message))} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-60 cursor-pointer">{ready ? 'Update details' : 'Save and generate ID card'}</button>
        {ready && (
          <button type="button" onClick={() => downloadCard(r, p)} className="px-4 py-2 rounded-xl border border-blue-700 text-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" /> Download ID card
          </button>
        )}
      </div>
    </form>
  );
};


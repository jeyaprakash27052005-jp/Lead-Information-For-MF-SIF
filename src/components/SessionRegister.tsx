import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ImagePlus, MapPin, UserPlus } from 'lucide-react';
import { AwarenessProgram } from '../types';
import { apiService } from '../services/api';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { formatDateTime } from '../utils/dateTime';

const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';

/** Shrinks the screenshot so it fits in the database (about 100-250 KB) */
const compress = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1100;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.75;
      let out = c.toDataURL('image/jpeg', q);
      while (out.length > 600000 && q > 0.3) {
        q -= 0.15;
        out = c.toDataURL('image/jpeg', q);
      }
      out.length > 700000 ? reject(new Error('The picture is too large.')) : resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a picture. Upload the screenshot as an image.'));
    };
    img.src = url;
  });

/** Separate registration form of one awareness session (opened by its own link) */
export const SessionRegister: React.FC<{ programId: string; onBack: () => void }> = ({ programId, onBack }) => {
  const [program, setProgram] = useState<AwarenessProgram | null | undefined>(undefined);
  const [f, setF] = useState({ attendeeType: 'customer' as 'customer' | 'member', name: '', mobile: '', email: '', city: '', guests: 0, note: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState('');
  const [taken, setTaken] = useState<number | null>(null);

  useEffect(() => {
    apiService
      .getAwarenessPrograms()
      .then((l: AwarenessProgram[]) => setProgram(l.find((p) => p.id === programId && p.isActive) ?? null))
      .catch(() => setProgram(null));
  }, [programId]);
  useEffect(() => {
    sessionRegStorage.list().then((l) => setTaken(l.filter((r) => r.programId === programId).length)).catch(() => setTaken(0));
  }, [programId, done]);

  if (program === undefined) return <p className="text-xs text-slate-400 text-center py-8">Loading...</p>;
  if (!program)
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
        <p className="text-sm text-slate-700">This session was not found or is no longer open for registration.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold cursor-pointer">See all sessions</button>
      </div>
    );

  const seatsLeft = program.maxRegistrations ? Math.max(0, program.maxRegistrations - (taken ?? 0)) : null;
  const full = seatsLeft === 0;
  const free = !!program.isPaid && !!program.freeFirst && (taken ?? 0) < program.freeFirst;
  const payNow = !!program.isPaid && !free;
  const over = new Date(program.endsAt || program.startsAt).getTime() + 3 * 3600000 < Date.now();

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      setProof(await compress(file));
      setProofName(file.name);
    } catch (err) {
      setProof(null);
      setError(err instanceof Error ? err.message : 'Could not read the picture.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sessionRegStorage.register(program, { ...f, paymentProof: proof ?? undefined });
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
      ) : full && !done ? (
        <p className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-800">Registration is full. All {program.maxRegistrations} seats are taken.</p>
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
          {seatsLeft !== null && <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Limited seats: {seatsLeft} of {program.maxRegistrations} left</p>}
          {program.isPaid && free && (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Free for you. The first {program.freeFirst} registrations are free. No payment is needed.
            </p>
          )}
          {payNow && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Paid session</p>
              <p className="text-sm text-slate-800">Amount to pay: <b className="text-lg">₹{program.fee}</b></p>
              <p className="text-sm text-slate-800">
                Pay by GPay to <b data-testid="gpay-number" className="font-mono text-base">{program.gpayNumber}</b>{program.gpayName ? ` (${program.gpayName})` : ''}
              </p>
              {!proof && (
                <div className="space-y-1.5">
                  <p className={lbl}>Upload the full payment screenshot (with transfer details)</p>
                  <label className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
                    <ImagePlus className="w-4 h-4" /> Upload payment screenshot
                    <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} className="sr-only" />
                  </label>
                </div>
              )}
              {proof ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Uploaded: {proofName}</p>
                  <img src={proof} alt="Payment screenshot" className="max-h-48 rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => { setProof(null); setProofName(''); }} className="text-xs font-bold text-rose-700 cursor-pointer">Remove and upload another</button>
                </div>
              ) : (
                <p className="text-[11px] font-semibold text-slate-600">The Register button works after you upload the screenshot.</p>
              )}
            </div>
          )}
          <button type="submit" disabled={busy || taken === null || (payNow && !proof)} className="w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
            <UserPlus className="w-4 h-4" /> {busy ? 'Please wait...' : 'Register'}
          </button>
        </form>
      )}
    </section>
  );
};

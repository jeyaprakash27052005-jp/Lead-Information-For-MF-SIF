import React, { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Download, IdCard, MapPin } from 'lucide-react';
import { AwarenessProgram, SessionRegistration, SiteCustomer } from '../types';
import { apiService } from '../services/api';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { formatDateTime } from '../utils/dateTime';

const input = 'w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';

const isOver = (p: AwarenessProgram) => new Date(p.endsAt || p.startsAt).getTime() + 3 * 3600000 < Date.now();
const cardNo = (r: SessionRegistration) => `${r.programId.slice(-4)}-${r.mobile.slice(-4)}`.toUpperCase();

const smallPhoto = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 240;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const m = Math.min(img.width, img.height);
      c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a picture.'));
    };
    img.src = url;
  });

const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

/** Draws the ID card on a canvas and downloads it as a picture */
const downloadCard = async (r: SessionRegistration, p: AwarenessProgram) => {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 560;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 900, 560);
  g.fillStyle = '#1d4ed8';
  g.fillRect(0, 0, 900, 110);
  g.fillStyle = '#ffffff';
  g.font = 'bold 22px sans-serif';
  g.fillText('EVENT ID CARD', 40, 45);
  g.font = 'bold 30px sans-serif';
  g.fillText(p.title.length > 44 ? `${p.title.slice(0, 43)}...` : p.title, 40, 88);
  if (r.cardPhoto) {
    try {
      g.drawImage(await loadImg(r.cardPhoto), 40, 150, 220, 220);
    } catch (_e) {
      /* no photo */
    }
  } else {
    g.fillStyle = '#e2e8f0';
    g.fillRect(40, 150, 220, 220);
  }
  g.fillStyle = '#0f172a';
  g.font = 'bold 40px sans-serif';
  g.fillText(r.cardName || r.name, 300, 190);
  g.font = '26px sans-serif';
  g.fillStyle = '#334155';
  const lines = [r.cardOccupation, r.cardCity, `Mobile: ${r.mobile}`, `Date: ${formatDateTime(p.startsAt)}`, p.mode === 'offline' && p.venue ? `Venue: ${p.venue}` : 'Online session'].filter(Boolean) as string[];
  lines.forEach((t, i) => g.fillText(t.length > 42 ? `${t.slice(0, 41)}...` : t, 300, 245 + i * 42));
  g.fillStyle = '#1d4ed8';
  g.font = 'bold 28px monospace';
  g.fillText(`ID: ${cardNo(r)}`, 40, 480);
  g.fillStyle = '#64748b';
  g.font = '18px sans-serif';
  g.fillText(`Registered as ${r.attendeeType}${r.guests ? ` (+${r.guests} guest${r.guests > 1 ? 's' : ''})` : ''}`, 40, 520);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `id-card-${cardNo(r)}.png`;
  a.click();
};

const CardForm: React.FC<{ r: SessionRegistration; p: AwarenessProgram; onSaved: () => void }> = ({ r, p, onSaved }) => {
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

/** The logged in customer: details and the sessions they registered for */
export const MyProfile: React.FC<{ customer: SiteCustomer }> = ({ customer }) => {
  const [regs, setRegs] = useState<SessionRegistration[] | null>(null);
  const [programs, setPrograms] = useState<AwarenessProgram[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    Promise.all([sessionRegStorage.list(), apiService.getAwarenessPrograms() as Promise<AwarenessProgram[]>])
      .then(([r, p]) => {
        setRegs(r.filter((x) => x.customerId === customer.id || (!x.customerId && x.mobile === customer.mobile)));
        setPrograms(p);
      })
      .catch(() => setError('Could not load your registrations. Please try again.'));
  useEffect(() => {
    load();
  }, [customer.id]);

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">My profile</p>
        <h1 className="text-xl font-black text-slate-900">{customer.fullName}</h1>
        <p className="text-sm text-slate-600">{customer.mobile} • {customer.email}</p>
      </div>
      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">My registered events</h2>
      {error && <p className="text-xs font-semibold text-rose-700">{error}</p>}
      {regs === null && !error && <p className="text-xs text-slate-400">Loading...</p>}
      {regs && regs.length === 0 && <p className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">You have not registered for any event yet. Open Awareness Sessions to register.</p>}
      {regs?.map((r) => {
        const p = programs.find((x) => x.id === r.programId);
        const done = p ? isOver(p) : false;
        return (
          <article key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5 text-xs">
            <h3 className="text-sm font-black text-slate-900">{r.programTitle}</h3>
            {p && (
              <p className="flex items-center gap-1.5 font-bold text-indigo-700"><CalendarDays className="w-3.5 h-3.5" /> {formatDateTime(p.startsAt)}</p>
            )}
            {p?.mode === 'offline' && p.venue && <p className="flex items-center gap-1.5 text-slate-600 font-semibold"><MapPin className="w-3.5 h-3.5" /> {p.venue}</p>}
            <p className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Registered</span>
              {r.amount ? <span className="px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">Paid ₹{r.amount}</span> : p?.isPaid ? <span className="px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">Free entry</span> : null}
              {done && <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">Completed</span>}
            </p>
            {p && done ? <CardForm r={r} p={p} onSaved={load} /> : <p className="text-[11px] text-slate-500">Your ID card is ready here after the event is complete.</p>}
          </article>
        );
      })}
    </section>
  );
};

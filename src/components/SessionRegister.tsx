import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ImagePlus, MapPin, UserPlus } from 'lucide-react';
import { AwarenessProgram } from '../types';
import { apiService } from '../services/api';
import { cardNo, cardUrl, qrImage, smallPhoto } from '../utils/idCard';
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
export const SessionRegister: React.FC<{ programId: string; start?: string; onBack: () => void }> = ({ programId, start, onBack }) => {
  const [program, setProgram] = useState<AwarenessProgram | null | undefined>(undefined);
  const [f, setF] = useState({ attendeeType: 'customer' as 'customer' | 'member', first: '', last: '', mobile: '', email: '', city: '', guests: 0, note: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [active, setActive] = useState(start || 'home');
  useEffect(() => setActive(start || 'home'), [start, programId]);
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [done2, setDone2] = useState<{ no: string; qr: string; url: string } | null>(null);
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
      if (!f.first.trim() || !f.last.trim()) throw new Error('Type your first name and last name.');
      if (!f.email.trim()) throw new Error('Type your e-mail address.');
      const reg = await sessionRegStorage.register(program, { ...f, name: `${f.first.trim()} ${f.last.trim()}`, paymentProof: proof ?? undefined, photo: photo ?? undefined });
      const url = cardUrl(reg.cardToken || '');
      setDone2({ no: cardNo(reg), url, qr: await qrImage(url, 260).catch(() => '') });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register.');
    } finally {
      setBusy(false);
    }
  };

  const Row: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
    <div className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4 py-2.5 text-sm">
      <dt className="text-slate-500 font-semibold">{k}</dt>
      <dd className="text-slate-900 font-medium whitespace-pre-line">{children}</dd>
    </div>
  );

  const sections = program.sections || [];
  const nav = [{ id: 'home', title: 'Home' }, ...sections.map((x) => ({ id: x.id, title: x.title })), { id: 'registration', title: 'Registration' }];
  const custom = sections.find((x) => x.id === active);
  const updated = formatDateTime(program.updatedAt || program.createdAt).split(',')[0];

  const homeBlock = (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Last Updated on: {updated}</p>
      <h2 className="text-base font-black text-slate-900">About the event:</h2>
      {program.description && <p className="text-sm text-slate-800 whitespace-pre-line">{program.description}</p>}
      <dl className="divide-y divide-slate-100 border-y border-slate-100">
        <Row k="Date & Time">
          {formatDateTime(program.startsAt)}{program.endsAt ? ` to ${formatDateTime(program.endsAt)}` : ''} in India
        </Row>
        <Row k="Mode">{program.mode === 'online' ? 'Online webinar (the joining link is on the Awareness Sessions page)' : `In person${program.venue ? `, ${program.venue}` : ''}`}</Row>
        {program.language && <Row k="Language">{program.language}</Row>}
        {program.speaker && <Row k="Speaker">{program.speaker}</Row>}
        {program.isPaid && <Row k="Fee">₹{program.fee}{program.freeFirst ? ` (first ${program.freeFirst} registrations are free)` : ''}</Row>}
        {seatsLeft !== null && <Row k="Seats">{seatsLeft} of {program.maxRegistrations} left</Row>}
      </dl>
      {!over && (
        <button type="button" onClick={() => setActive('registration')} className="px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white text-sm font-bold cursor-pointer">Register Now</button>
      )}
    </div>
  );

  const customBlock = custom && (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Last Updated on: {updated}</p>
      <h2 className="text-base font-black text-slate-900">{custom.title}</h2>
      {custom.body && <div className="space-y-3 text-sm text-slate-800">{custom.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}</div>}
      {(custom.fileUrl || (custom.linkUrl && /^https:\/\//i.test(custom.linkUrl))) && (
        <a
          href={custom.fileUrl || custom.linkUrl}
          {...(custom.fileUrl ? { download: custom.fileName || `${custom.title}.pdf` } : { target: '_blank', rel: 'noopener noreferrer' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold"
        >
          {custom.fileUrl ? `Download ${custom.title.replace(/^Download\s+/i, '')}` : 'Open'}
        </a>
      )}
      {!custom.body && !custom.fileUrl && !custom.linkUrl && <p className="text-sm font-bold text-amber-700">Will be updated soon</p>}
    </div>
  );

  return (
    <section className="max-w-5xl mx-auto space-y-4">
      {program.imageUrl && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex justify-center">
          <img src={program.imageUrl} alt={program.title} className="max-h-56 w-auto max-w-full object-contain rounded-xl" />
        </div>
      )}
      <p className="text-xs text-slate-500">
        <a href="#/home" className="hover:underline">Home</a> / <a href="#/sessions" className="hover:underline">Events</a> / {program.title}
      </p>
      <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">{program.title}</h1>
      <div className="grid md:grid-cols-[14rem_1fr] gap-4 items-start">
        <aside className="bg-white rounded-2xl border border-slate-200 p-2 flex md:flex-col gap-1 overflow-x-auto md:sticky md:top-20" aria-label="Event pages">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActive(n.id)}
              className={`text-left whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${active === n.id ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'text-slate-800 hover:bg-slate-50'}`}
            >
              {n.title}
            </button>
          ))}
        </aside>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-6 min-w-0">
      {active === 'home' && homeBlock}
      {custom && active !== 'home' && active !== 'registration' && customBlock}
      {active === 'registration' && (over ? (
        <p className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-semibold text-amber-800">This session is over. Registration is closed.</p>
      ) : full && !done ? (
        <p className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-800">Registration is full. All {program.maxRegistrations} seats are taken.</p>
      ) : done ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-emerald-900">Thank you {f.first} {f.last}. You are registered.</p>
          {done2 && (
            <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your event ID</p>
              <p data-testid="event-id" className="font-mono text-2xl font-black text-blue-700">{done2.no}</p>
              {done2.qr && <img src={done2.qr} alt="Event ID QR code" className="w-44 h-44 mx-auto" />}
              <p className="text-[11px] text-slate-600">Scan this QR code to open your ID card and download it.</p>
              <a href={done2.url} className="inline-block text-xs font-bold text-blue-700 underline">Open ID card</a>
            </div>
          )}
          <p className="text-xs text-emerald-800">Keep this QR code. After the event, scan it to add your details and download your ID card.</p>
          <button onClick={onBack} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-sm font-bold cursor-pointer">Back to sessions</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h2 className="text-sm font-black text-slate-900">{program.mode === 'online' ? 'Webinar Registration' : 'Event Registration'}</h2>
          {error && (
            <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className={lbl}>First Name *<input required value={f.first} maxLength={50} onChange={(e) => setF({ ...f, first: e.target.value })} placeholder="First Name" autoComplete="given-name" className={`mt-1 ${input}`} /></label>
            <label className={lbl}>Last Name *<input required value={f.last} maxLength={50} onChange={(e) => setF({ ...f, last: e.target.value })} placeholder="Last Name" autoComplete="family-name" className={`mt-1 ${input}`} /></label>
            <label className={lbl}>Email Address *<input required type="email" value={f.email} maxLength={120} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="join@company.com" autoComplete="email" className={`mt-1 ${input}`} /></label>
            <label className={lbl}>Phone *<input required value={f.mobile} inputMode="tel" maxLength={16} onChange={(e) => setF({ ...f, mobile: e.target.value })} placeholder="Your phone number" autoComplete="tel" className={`mt-1 ${input}`} /></label>
            <label className={lbl}>City (optional)<input value={f.city} maxLength={60} onChange={(e) => setF({ ...f, city: e.target.value })} className={`mt-1 ${input}`} /></label>
            <label className={lbl}>People coming with you<input type="number" min={0} max={10} value={f.guests} onChange={(e) => setF({ ...f, guests: Number(e.target.value) })} className={`mt-1 ${input}`} /></label>
          </div>
          <label className={lbl}>Message (optional)<textarea value={f.note} maxLength={500} rows={2} onChange={(e) => setF({ ...f, note: e.target.value })} className={`mt-1 ${input}`} /></label>
          {seatsLeft !== null && <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Limited seats: {seatsLeft} of {program.maxRegistrations} left</p>}
          <div className="space-y-1.5">
            <p className={lbl}>Your photo (for the ID card)</p>
            <div className="flex items-center gap-3">
              {photo ? <img src={photo} alt="Your photo" className="w-16 h-16 rounded-lg object-cover border border-slate-200" /> : <div className="w-16 h-16 rounded-lg bg-slate-100 border border-dashed border-slate-300" />}
              <label className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center gap-2 cursor-pointer">
                <ImagePlus className="w-4 h-4" /> {photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && smallPhoto(e.target.files[0]).then(setPhoto).catch((er) => setError(er.message))} />
              </label>
            </div>
          </div>
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
                  <label className="w-full px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
                    <ImagePlus className="w-4 h-4" /> Upload file
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
          <button type="submit" disabled={busy || taken === null || !photo || (payNow && !proof)} className="w-full px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
            <UserPlus className="w-4 h-4" /> {busy ? 'Please wait...' : 'Register'}
          </button>
        </form>
      ))}
        </div>
      </div>
    </section>
  );
};

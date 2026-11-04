import React, { useEffect, useState } from 'react';
import { CalendarDays, Download, MapPin } from 'lucide-react';
import { AwarenessProgram, SessionRegistration } from '../types';
import { apiService } from '../services/api';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { formatDateTime } from '../utils/dateTime';
import { cardNo, cardUrl, downloadCard, qrImage } from '../utils/idCard';

/** Opened by scanning the QR code of an ID card: shows the ID card with a download button (no login needed) */
export const IdCardView: React.FC<{ token: string }> = ({ token }) => {
  const [state, setState] = useState<{ r: SessionRegistration; p: AwarenessProgram } | null | undefined>(undefined);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await sessionRegStorage.getByToken(token);
        if (!r) return setState(null);
        const programs = (await apiService.getAwarenessPrograms()) as AwarenessProgram[];
        const p = programs.find((x) => x.id === r.programId);
        setState(p ? { r, p } : null);
        qrImage(cardUrl(token)).then(setQr).catch(() => undefined);
      } catch (_e) {
        setState(null);
      }
    })();
  }, [token]);

  if (state === undefined) return <p className="text-xs text-slate-400 text-center py-8">Loading...</p>;
  if (!state) return <p className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-600">This ID card was not found.</p>;
  const { r, p } = state;

  return (
    <section className="max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-blue-700 text-white px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Event ID card</p>
          <h1 className="text-lg font-black leading-snug">{p.title}</h1>
        </div>
        <div className="p-5 flex gap-4">
          {r.cardPhoto ? <img src={r.cardPhoto} alt="" className="w-24 h-24 rounded-lg object-cover border border-slate-200" /> : <div className="w-24 h-24 rounded-lg bg-slate-100" />}
          <div className="space-y-1 text-xs text-slate-600 min-w-0">
            <p className="text-base font-black text-slate-900">{r.cardName || r.name}</p>
            {r.cardOccupation && <p>{r.cardOccupation}</p>}
            {r.cardCity && <p>{r.cardCity}</p>}
            <p className="flex items-center gap-1.5 font-bold text-indigo-700"><CalendarDays className="w-3.5 h-3.5" /> {formatDateTime(p.startsAt)}</p>
            {p.mode === 'offline' && p.venue && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {p.venue}</p>}
          </div>
        </div>
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <p className="font-mono text-lg font-black text-blue-700">ID: {cardNo(r)}</p>
          {qr && <img src={qr} alt="QR code" className="w-24 h-24" />}
        </div>
      </div>
      <button onClick={() => downloadCard(r, p)} className="w-full px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
        <Download className="w-4 h-4" /> Download ID card
      </button>
    </section>
  );
};

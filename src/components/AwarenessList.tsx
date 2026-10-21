import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Video, Mic, Languages, Phone, Megaphone } from 'lucide-react';
import { AwarenessProgram } from '../types';
import { apiService } from '../services/api';
import { formatDateTime } from '../utils/dateTime';
import { useAppSettings } from '../context/AppSettings';

const endOf = (p: AwarenessProgram) => new Date(p.endsAt || p.startsAt).getTime() + 3 * 60 * 60 * 1000;

/** The awareness programmes the admin team added, for customers and the Home Screen (read only) */
export const AwarenessList: React.FC<{ limit?: number; compact?: boolean; hideWhenEmpty?: boolean }> = ({ limit, compact, hideWhenEmpty }) => {
  const { settings } = useAppSettings();
  const [programs, setPrograms] = useState<AwarenessProgram[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      apiService
        .getAwarenessPrograms()
        .then((list: AwarenessProgram[]) => alive && setPrograms(list))
        .catch(() => alive && setPrograms((old) => old ?? []));
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!settings.features.awarenessPrograms) return null;
  if (programs === null) return <p className="text-xs font-semibold text-slate-400 py-6 text-center">Loading...</p>;

  const now = Date.now();
  const active = programs.filter((p) => p.isActive);
  const upcoming = active.filter((p) => endOf(p) >= now);
  const past = active.filter((p) => endOf(p) < now).reverse().slice(0, 3);
  const shown = limit ? upcoming.slice(0, limit) : upcoming;
  if (hideWhenEmpty && shown.length === 0) return null;

  const card = (p: AwarenessProgram, i: number, isPast = false) => (
    <article
      key={p.id}
      style={{ ['--d' as string]: `${Math.min(i, 8) * 70}ms` }}
      className={`anim-rise lift-card bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-2.5 ${isPast ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-black text-slate-900 leading-snug">{p.title}</h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            p.mode === 'online' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {p.mode === 'online' ? 'Online' : 'In person'}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
        <CalendarDays className="w-3.5 h-3.5" />
        {formatDateTime(p.startsAt)}
        {p.endsAt ? ` to ${formatDateTime(p.endsAt)}` : ''}
        {isPast && <span className="ml-1 text-slate-400 font-semibold">(completed)</span>}
      </p>
      {!compact && p.description && <p className="text-xs text-slate-600 whitespace-pre-line">{p.description}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-semibold">
        {p.mode === 'offline' && p.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {p.venue}
          </span>
        )}
        {p.speaker && (
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3" /> {p.speaker}
          </span>
        )}
        {p.language && (
          <span className="flex items-center gap-1">
            <Languages className="w-3 h-3" /> {p.language}
          </span>
        )}
        {p.contact && (
          <a href={`tel:${p.contact.replace(/\s+/g, '')}`} className="flex items-center gap-1 hover:text-indigo-700">
            <Phone className="w-3 h-3" /> {p.contact}
          </a>
        )}
      </div>
      {!isPast && p.mode === 'online' && p.joinLink && /^https:\/\//i.test(p.joinLink) && (
        <a
          href={p.joinLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          <Video className="w-3.5 h-3.5" /> Join online
        </a>
      )}
    </article>
  );

  return (
    <div className="space-y-4">
      {shown.length === 0 && past.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
          <Megaphone className="w-6 h-6 mx-auto text-slate-300 mb-2" />
          No awareness programmes are scheduled right now. Please check back soon.
        </div>
      )}
      {shown.length > 0 && <div className="grid gap-4 md:grid-cols-2">{shown.map((p, i) => card(p, i))}</div>}
      {!limit && past.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recently completed</p>
          <div className="grid gap-4 md:grid-cols-2">{past.map((p, i) => card(p, i, true))}</div>
        </div>
      )}
    </div>
  );
};

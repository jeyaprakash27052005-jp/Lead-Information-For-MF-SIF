import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, CheckCircle2, RefreshCw, Search, Undo2 } from 'lucide-react';
import { Lead, SipFrequency, SipPlan, User } from '../types';
import { sipStorage } from '../services/sipStorage';
import { SIP_FREQUENCIES, SIP_REMIND_DAYS, dayString, dueFor, frequencyLabel, isReminded, optionLabel, reminderDate, whenText } from '../utils/sipSchedule';
import { formatInr } from '../utils/currency';
import { dateText } from './SipPlans';

/** Every SIP due within 3 days (the reminder), and the next date of all other SIPs, for the leads this person can see */
export const SipReminders: React.FC<{ leads: Lead[]; currentUser: User; onViewLead: (lead: Lead) => void }> = ({ leads, currentUser, onViewLead }) => {
  const [plans, setPlans] = useState<SipPlan[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'' | SipFrequency>('');
  const [status, setStatus] = useState<'' | 'to_remind' | 'reminded'>('');
  const [region, setRegion] = useState('');
  const [when, setWhen] = useState<'' | 'soon' | 'week' | 'month'>('');
  const [busy, setBusy] = useState<string | null>(null);
  const load = () =>
    sipStorage
      .getPlans()
      .then((l) => {
        setPlans(l);
        setError(false);
      })
      .catch(() => {
        setPlans((o) => o ?? []);
        setError(true);
      });
  useEffect(() => {
    load();
  }, []);

  const regions = useMemo(() => Array.from(new Set(leads.map((l) => l.assignedRegion).filter(Boolean))).sort(), [leads]);

  const rows = useMemo(() => {
    const ids = new Map(leads.map((l) => [l.id, l]));
    const needle = q.trim().toLowerCase();
    return (plans ?? [])
      .filter((p) => ids.has(p.leadId))
      .map((p) => ({ lead: ids.get(p.leadId)!, due: dueFor(p) }))
      .filter((r) => r.due)
      .filter((r) => !mode || r.due!.plan.frequency === mode)
      .filter((r) => !region || r.lead.assignedRegion === region)
      .filter((r) => !needle || r.lead.name.toLowerCase().includes(needle) || r.due!.plan.schemeName.toLowerCase().includes(needle) || (r.lead.mobile || '').includes(needle))
      .filter((r) => !status || (status === 'reminded') === isReminded(r.due!.plan, r.due!.date))
      .filter((r) => !when || (when === 'soon' ? r.due!.inDays <= SIP_REMIND_DAYS : when === 'week' ? r.due!.inDays <= 7 : r.due!.inDays <= 31))
      .sort((a, b) => a.due!.date.getTime() - b.due!.date.getTime());
  }, [plans, leads, q, mode, status, region, when]);

  const mark = async (plan: SipPlan, date: Date, done: boolean) => {
    setBusy(plan.id);
    try {
      const next: SipPlan = done
        ? { ...plan, remindedFor: dayString(date), remindedAt: new Date().toISOString(), remindedBy: currentUser.name }
        : { ...plan, remindedFor: '', remindedAt: '', remindedBy: '' };
      await sipStorage.savePlan(next);
      setPlans((old) => (old ?? []).map((p) => (p.id === plan.id ? next : p)));
    } catch (_e) {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  // investors who are Ready to Invest but have no SIP entered yet
  const withSip = new Set((plans ?? []).map((p) => p.leadId));
  const waiting = leads.filter((l) => l.status === 'Ready to Invest' && !withSip.has(l.id));

  const soon = rows.filter((r) => r.due!.remind);
  const later = rows.filter((r) => !r.due!.remind);

  const row = (r: (typeof rows)[number]) => {
    const d = r.due!;
    return (
      <li key={d.plan.id} className="py-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm">{r.lead.name}</p>
          <p className="text-slate-600">
            {d.plan.schemeName} · {formatInr(d.plan.amount)} <b>{frequencyLabel(d.plan.frequency)}</b> · {optionLabel(d.plan.option)}
          </p>
          <p className="text-slate-500">Reminder date: {dateText(dayString(reminderDate(d.date)))}</p>
          {isReminded(d.plan, d.date) && (
            <p className="text-emerald-700 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Investor reminded by {d.plan.remindedBy || 'incharge'}{d.plan.remindedAt ? ` on ${dateText(dayString(new Date(d.plan.remindedAt)))}` : ''}</p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full font-bold border ${d.remind ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          {whenText(d.inDays)} · {dateText(dayString(d.date))}
        </span>
        {isReminded(d.plan, d.date) ? (
          <button type="button" disabled={busy === d.plan.id} onClick={() => mark(d.plan, d.date, false)} className="px-3 py-1.5 rounded-md border border-slate-300 font-bold flex items-center gap-1 cursor-pointer">
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
        ) : (
          <button type="button" disabled={busy === d.plan.id} onClick={() => mark(d.plan, d.date, true)} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold flex items-center gap-1 cursor-pointer">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark reminded
          </button>
        )}
        <button type="button" onClick={() => onViewLead(r.lead)} className="px-3 py-1.5 rounded-md border border-slate-300 font-bold cursor-pointer">Open profile</button>
      </li>
    );
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarClock className="w-4 h-4" /> SIP Reminders
          </div>
          <h2 className="text-lg font-black text-slate-900">Investments coming up</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Each SIP is entered in the investor's profile once they are <b>Ready to Invest</b>. A reminder shows here {SIP_REMIND_DAYS} days before every investment date, based on the order mode (daily, weekly or monthly).
          </p>
        </div>
        <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">Could not read the SIPs from the online database. Publish the latest <b>firestore.rules</b> in Firebase (it adds the "sipPlans" collection), then press Refresh. Investors who are Ready to Invest are still listed below.</p>}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Investor, scheme or mobile" className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded-lg font-semibold" />
        </label>
        <select value={mode} onChange={(e) => setMode(e.target.value as '' | SipFrequency)} aria-label="Order mode" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
          <option value="">All order modes</option>
          {SIP_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as '' | 'to_remind' | 'reminded')} aria-label="Reminder status" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
          <option value="">Reminded and not reminded</option>
          <option value="to_remind">Not reminded yet</option>
          <option value="reminded">Already reminded</option>
        </select>
        <select value={when} onChange={(e) => setWhen(e.target.value as '' | 'soon' | 'week' | 'month')} aria-label="Investment date" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
          <option value="">Any investment date</option>
          <option value="soon">Within 3 days</option>
          <option value="week">Within 7 days</option>
          <option value="month">Within 31 days</option>
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
          <option value="">All regions</option>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-5">
        <p className="flex items-center gap-1.5 font-bold text-amber-900 text-sm mb-1"><BellRing className="w-4 h-4" /> Due in the next {SIP_REMIND_DAYS} days ({soon.length})</p>
        {plans === null && <p className="text-xs text-slate-400 py-4">Loading...</p>}
        {plans !== null && soon.length === 0 && <p className="text-xs text-slate-500 py-3">No investment is due in the next {SIP_REMIND_DAYS} days.</p>}
        <ul className="divide-y divide-slate-100">{soon.map(row)}</ul>
      </div>
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5">
        <p className="font-bold text-emerald-900 text-sm mb-1">Ready to Invest, SIP not entered yet ({waiting.length})</p>
        {waiting.length === 0 && <p className="text-xs text-slate-500 py-3">Every Ready to Invest investor has a SIP.</p>}
        <ul className="divide-y divide-slate-100">
          {waiting.map((l) => (
            <li key={l.id} className="py-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm">{l.name}</p>
                <p className="text-slate-600">{l.mobile ? `Mobile ${l.mobile}` : 'No mobile number'}</p>
              </div>
              <button type="button" onClick={() => onViewLead(l)} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold cursor-pointer">Open profile and add SIP</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <p className="font-bold text-slate-900 text-sm mb-1">All other running SIPs ({later.length})</p>
        {plans !== null && later.length === 0 && <p className="text-xs text-slate-500 py-3">Nothing else is scheduled.</p>}
        <ul className="divide-y divide-slate-100">{later.map(row)}</ul>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, RefreshCw } from 'lucide-react';
import { Lead, SipPlan } from '../types';
import { sipStorage } from '../services/sipStorage';
import { SIP_REMIND_DAYS, dayString, dueFor, frequencyLabel, optionLabel, reminderDate, whenText } from '../utils/sipSchedule';
import { formatInr } from '../utils/currency';
import { dateText } from './SipPlans';

/** Every SIP due within 3 days (the reminder), and the next date of all other SIPs, for the leads this person can see */
export const SipReminders: React.FC<{ leads: Lead[]; onViewLead: (lead: Lead) => void }> = ({ leads, onViewLead }) => {
  const [plans, setPlans] = useState<SipPlan[] | null>(null);
  const [error, setError] = useState(false);
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

  const rows = useMemo(() => {
    const ids = new Map(leads.map((l) => [l.id, l]));
    return (plans ?? [])
      .filter((p) => ids.has(p.leadId))
      .map((p) => ({ lead: ids.get(p.leadId)!, due: dueFor(p) }))
      .filter((r) => r.due)
      .sort((a, b) => a.due!.date.getTime() - b.due!.date.getTime());
  }, [plans, leads]);

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
        </div>
        <span className={`px-2.5 py-1 rounded-full font-bold border ${d.remind ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          {whenText(d.inDays)} · {dateText(dayString(d.date))}
        </span>
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

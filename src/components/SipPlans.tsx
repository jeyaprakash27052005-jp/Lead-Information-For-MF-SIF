import React, { useEffect, useState } from 'react';
import { BellRing, CalendarClock, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Lead, SipFrequency, SipOption, SipPlan, User } from '../types';
import { sipStorage } from '../services/sipStorage';
import { SIP_FREQUENCIES, SIP_OPTIONS, dayString, dueFor, frequencyLabel, optionLabel, whenText } from '../utils/sipSchedule';
import { formatInr } from '../utils/currency';
import { formatDateTime } from '../utils/dateTime';

const empty = () => ({ schemeName: '', startDate: dayString(new Date()), endDate: '', amount: '', option: 'growth' as SipOption, frequency: 'monthly' as SipFrequency });
const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white';
const lbl = 'block text-[11px] font-bold text-slate-700 uppercase tracking-wider';
export const dateText = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** SIP investments of one lead: entered by hand once the lead is Ready to Invest, with the 3 day reminder */
export const SipPlans: React.FC<{ lead: Lead; currentUser: User }> = ({ lead, currentUser }) => {
  const [plans, setPlans] = useState<SipPlan[] | null>(null);
  const [form, setForm] = useState(empty());
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ready = lead.status === 'Ready to Invest';

  const load = () =>
    sipStorage
      .getPlans()
      .then((l) => setPlans(l.filter((p) => p.leadId === lead.id)))
      .catch(() => setPlans((o) => o ?? []));
  useEffect(() => {
    setPlans(null);
    load();
  }, [lead.id]);

  if (plans === null) return null;
  if (!ready && plans.length === 0) return null;

  const set = (p: Partial<ReturnType<typeof empty>>) => setForm((f) => ({ ...f, ...p }));
  const close = () => {
    setForm(empty());
    setEditing(null);
    setAdding(false);
    setError(null);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (form.schemeName.trim().length < 3) return setError('Type the investment scheme name.');
    if (!form.startDate) return setError('Choose the SIP starting date.');
    if (!form.endDate) return setError('Choose the SIP end date.');
    if (form.endDate < form.startDate) return setError('The end date must be on or after the starting date.');
    if (!(amount >= 100)) return setError('Type the investment amount (at least 100).');
    setSaving(true);
    setError(null);
    const old = plans.find((p) => p.id === editing);
    try {
      await sipStorage.savePlan({
        id: editing || `sip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        leadId: lead.id,
        leadName: lead.name,
        schemeName: form.schemeName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        amount,
        option: form.option,
        frequency: form.frequency,
        isActive: old?.isActive ?? true,
        addedBy: old?.addedBy || currentUser.name,
        createdAt: old?.createdAt || new Date().toISOString(),
      });
      close();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the SIP.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (p: SipPlan) => {
    setEditing(p.id);
    setAdding(true);
    setError(null);
    setForm({ schemeName: p.schemeName, startDate: p.startDate, endDate: p.endDate, amount: String(p.amount), option: p.option, frequency: p.frequency });
  };
  const remove = async (p: SipPlan) => {
    if (!window.confirm(`Delete the SIP "${p.schemeName}"?`)) return;
    try {
      await sipStorage.deletePlan(p.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the SIP.');
    }
  };
  const toggle = async (p: SipPlan) => {
    try {
      await sipStorage.savePlan({ ...p, isActive: !p.isActive });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the SIP.');
    }
  };

  return (
    <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-200 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
          <CalendarClock className="w-3.5 h-3.5" /> SIP Investment
        </div>
        {ready && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add SIP
          </button>
        )}
      </div>

      {error && <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</p>}

      {adding && (
        <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-3">
          <p className="text-xs font-bold text-slate-900">{editing ? 'Edit SIP' : 'New SIP'}</p>
          <label className={lbl}>
            Investment scheme name *
            <input value={form.schemeName} maxLength={200} onChange={(e) => set({ schemeName: e.target.value })} placeholder="e.g. Nifty 50 Index Fund - Direct" className={`mt-1 ${input}`} />
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className={lbl}>
              Starting date *
              <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className={`mt-1 ${input}`} />
            </label>
            <label className={lbl}>
              End of SIP *
              <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => set({ endDate: e.target.value })} className={`mt-1 ${input}`} />
            </label>
            <label className={lbl}>
              Investment amount (₹) *
              <input value={form.amount} inputMode="numeric" onChange={(e) => set({ amount: e.target.value.replace(/[^0-9]/g, '') })} className={`mt-1 ${input}`} />
            </label>
          </div>
          <fieldset className="space-y-1.5">
            <legend className={lbl}>Option</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {SIP_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input type="radio" name={`sip-option-${lead.id}`} checked={form.option === o.value} onChange={() => set({ option: o.value })} /> {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-1.5">
            <legend className={lbl}>Order mode (how often the SIP is invested)</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {SIP_FREQUENCIES.map((o) => (
                <label key={o.value} className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input type="radio" name={`sip-frequency-${lead.id}`} checked={form.frequency === o.value} onChange={() => set({ frequency: o.value })} /> {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[11px] text-slate-500">
            {form.frequency === 'daily' && 'Invested every day from the starting date.'}
            {form.frequency === 'weekly' && 'Invested on the same weekday as the starting date, every week.'}
            {form.frequency === 'monthly' && 'Invested on the same day of the month as the starting date (the last day in shorter months).'} The reminder shows 3 days before each investment date.
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={save} className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60">
              <Save className="w-3.5 h-3.5" /> {editing ? 'Save changes' : 'Save SIP'}
            </button>
            <button type="button" onClick={close} className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 && !adding && <p className="text-xs text-slate-500">No SIP entered yet. Press <b>Add SIP</b> when the investor starts investing.</p>}

      <ul className="space-y-2">
        {plans.map((p) => {
          const due = dueFor(p);
          return (
            <li key={p.id} className={`bg-white border rounded-lg p-3 text-xs space-y-1.5 ${p.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-900 text-sm">{p.schemeName}</p>
                <span className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => toggle(p)} className="px-2 py-1 rounded-md border border-slate-200 font-bold cursor-pointer">{p.isActive ? 'Pause' : 'Resume'}</button>
                  <button type="button" aria-label="Edit SIP" onClick={() => edit(p)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" aria-label="Delete SIP" onClick={() => remove(p)} className="p-1.5 rounded-md border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              </div>
              <p className="text-slate-600">
                {formatInr(p.amount)} <b>{frequencyLabel(p.frequency)}</b> · {optionLabel(p.option)} · {dateText(p.startDate)} to {dateText(p.endDate)}
              </p>
              {due && p.isActive ? (
                <p className={`flex items-center gap-1.5 font-bold ${due.remind ? 'text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5' : 'text-slate-600'}`}>
                  <BellRing className="w-3.5 h-3.5" />
                  {due.remind ? `Reminder: ${frequencyLabel(p.frequency)} SIP of ${formatInr(p.amount)} is due ${whenText(due.inDays).toLowerCase()} (${dateText(dayString(due.date))})` : `Next investment: ${dateText(dayString(due.date))} (${whenText(due.inDays).toLowerCase()})`}
                </p>
              ) : (
                <p className="text-slate-500">{p.isActive ? 'This SIP has ended.' : 'Paused.'}</p>
              )}
              <p className="text-[10px] text-slate-400">Entered by {p.addedBy} on {formatDateTime(p.createdAt)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

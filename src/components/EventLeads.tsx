import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, MapPin, Plus, Pencil, Trash2, Save, X, RefreshCw, AlertCircle, Download, Lock, Unlock, Search, Building2, User as UserIcon, Phone } from 'lucide-react';
import { EventInfo, EventLead, EventLeadCategory, User } from '../types';
import { eventsStorage } from '../services/eventsStorage';
import { normalizeIndianMobile, formatIndianMobile } from '../utils/validation';
import { formatDateTime } from '../utils/dateTime';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';
const newId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
const day = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const emptyEvent = () => ({ name: '', date: todayStr(), endDate: '', venue: '', description: '' });
const emptyLead = () => ({ category: 'individual' as EventLeadCategory, companyName: '', personName: '', mobile: '', narration: '' });

/** Event Leads: Head and Regional Incharge create events; every admin then adds the leads met at an event */
export const EventLeads: React.FC<Props> = ({ currentUser, onNotify }) => {
  const isHead = currentUser.role === 'head';
  const canCreate = isHead || currentUser.role === 'regional_incharge';
  const [events, setEvents] = useState<EventInfo[] | null>(null);
  const [leads, setLeads] = useState<EventLead[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent());
  const [eventOpen, setEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState(emptyLead());
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'' | EventLeadCategory>('');
  const [delEvent, setDelEvent] = useState<EventInfo | null>(null);
  const [delLead, setDelLead] = useState<EventLead | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [e, l] = await Promise.all([eventsStorage.getEvents(), eventsStorage.getLeads()]);
      setEvents(e);
      setLeads(l);
      setError(null);
    } catch (_e) {
      setEvents((o) => o ?? []);
      setError('Could not read the events from the online database. Publish the latest firestore.rules (it adds "events" and "eventLeads") and press Refresh.');
    }
  };
  useEffect(() => {
    load();
  }, []);

  // events this person can see: whole-organisation events, or those of their own region
  const visibleEvents = useMemo(() => (events ?? []).filter((e) => isHead || !e.region || e.region === currentUser.region), [events, isHead, currentUser.region]);
  useEffect(() => {
    if (!visibleEvents.some((e) => e.id === selected)) setSelected(visibleEvents[0]?.id || '');
  }, [visibleEvents, selected]);
  const event = visibleEvents.find((e) => e.id === selected);

  // Head sees every lead, Regional Incharge the leads of their region, Area Incharge their own
  const canSee = (l: EventLead) => isHead || (currentUser.role === 'regional_incharge' ? l.region === currentUser.region || l.addedByUserId === currentUser.id : l.addedByUserId === currentUser.id);
  const canEditLead = (l: EventLead) => isHead || l.addedByUserId === currentUser.id || (currentUser.role === 'regional_incharge' && l.region === currentUser.region);
  const canEditEvent = (e: EventInfo) => isHead || (currentUser.role === 'regional_incharge' && e.createdById === currentUser.id);

  const eventLeads = leads.filter((l) => l.eventId === selected && canSee(l));
  const shown = eventLeads.filter((l) => {
    const n = q.trim().toLowerCase();
    return (!cat || l.category === cat) && (!n || [l.personName, l.companyName || '', l.mobile, l.narration || '', l.addedByName].some((x) => x.toLowerCase().includes(n)));
  });
  const countFor = (id: string) => leads.filter((l) => l.eventId === id && canSee(l)).length;

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
      if (ok) onNotify?.(ok, 'success');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const saveEvent = async () => {
    const f = eventForm;
    if (f.name.trim().length < 3) return setError('Type the event name.');
    if (!f.date) return setError('Choose the event date.');
    if (f.endDate && f.endDate < f.date) return setError('The end date must be on or after the event date.');
    if (f.venue.trim().length < 2) return setError('Type the venue.');
    const old = events?.find((e) => e.id === editingEvent);
    const e: EventInfo = {
      id: editingEvent || newId('evt'),
      name: f.name.trim(),
      date: f.date,
      endDate: f.endDate || '',
      venue: f.venue.trim(),
      description: f.description.trim(),
      region: old ? old.region : isHead ? '' : currentUser.region,
      isActive: old?.isActive ?? true,
      createdBy: old?.createdBy || currentUser.name,
      createdByRole: old?.createdByRole || currentUser.role,
      createdById: old?.createdById || currentUser.id,
      createdAt: old?.createdAt || new Date().toISOString(),
    };
    await run(() => eventsStorage.saveEvent(e), old ? 'Event updated.' : 'Event created. All admins can add leads to it now.');
    setEventOpen(false);
    setEditingEvent(null);
    setEventForm(emptyEvent());
    setSelected(e.id);
  };

  const startEditEvent = (e: EventInfo) => {
    setEditingEvent(e.id);
    setEventForm({ name: e.name, date: e.date, endDate: e.endDate || '', venue: e.venue, description: e.description || '' });
    setEventOpen(true);
    setError(null);
  };

  const validateLead = (): string | null => {
    const f = leadForm;
    if (f.category === 'company' && f.companyName.trim().length < 2) return 'Type the company name.';
    if (f.personName.trim().length < 2) return 'Type the person name.';
    if (!normalizeIndianMobile(f.mobile)) return 'Type a valid 10 digit mobile number (starting with 6, 7, 8 or 9).';
    return null;
  };

  const saveLead = async () => {
    if (!event) return;
    const v = validateLead();
    if (v) return setError(v);
    const f = leadForm;
    const old = leads.find((l) => l.id === editingLead);
    const l: EventLead = {
      id: editingLead || newId('el'),
      eventId: event.id,
      eventName: event.name,
      category: f.category,
      companyName: f.category === 'company' ? f.companyName.trim() : '',
      personName: f.personName.trim(),
      mobile: normalizeIndianMobile(f.mobile)!,
      narration: f.narration.trim(),
      region: old?.region || currentUser.region,
      addedByUserId: old?.addedByUserId || currentUser.id,
      addedByName: old?.addedByName || currentUser.name,
      addedByRole: old?.addedByRole || currentUser.role,
      createdAt: old?.createdAt || new Date().toISOString(),
    };
    await run(() => eventsStorage.saveLead(l), old ? 'Event lead updated.' : 'Event lead added.');
    setLeadForm(emptyLead());
    setEditingLead(null);
  };

  const startEditLead = (l: EventLead) => {
    setEditingLead(l.id);
    setLeadForm({ category: l.category, companyName: l.companyName || '', personName: l.personName, mobile: l.mobile, narration: l.narration || '' });
    setError(null);
  };

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [['Event', 'Category', 'Company', 'Person', 'Mobile', 'Narration', 'Added by', 'Region', 'Added on'], ...eventLeads.map((l) => [l.eventName, l.category === 'company' ? 'Company' : 'Individual', l.companyName || '', l.personName, l.mobile, l.narration || '', l.addedByName, l.region, l.createdAt])];
    const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `event-leads-${(event?.name || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" /> Event Leads
          </div>
          <h2 className="text-lg font-black text-slate-900">Leads collected at events</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {canCreate ? 'Create an event first. Then every admin can add the people they meet at it.' : 'Choose an event created by the Head or Regional Incharge and add the people you meet.'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          {canCreate && !eventOpen && (
            <button type="button" onClick={() => { setEditingEvent(null); setEventForm(emptyEvent()); setEventOpen(true); }} className="btn-glow px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> New event
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      {canCreate && eventOpen && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-xs p-5 space-y-3 text-xs">
          <p className="font-bold text-slate-900 text-sm">{editingEvent ? 'Edit event' : 'New event'}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={lbl}>
              Event name *
              <input value={eventForm.name} maxLength={160} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Investor Meet - Sivakasi" className={`mt-1 ${input}`} />
            </label>
            <label className={lbl}>
              Venue *
              <input value={eventForm.venue} maxLength={300} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Hall / address" className={`mt-1 ${input}`} />
            </label>
            <label className={lbl}>
              Event date *
              <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className={`mt-1 ${input}`} />
            </label>
            <label className={lbl}>
              End date (if more than one day)
              <input type="date" value={eventForm.endDate} min={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} className={`mt-1 ${input}`} />
            </label>
          </div>
          <label className={lbl}>
            Details (optional)
            <textarea value={eventForm.description} rows={2} maxLength={1000} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={saveEvent} className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              <Save className="w-3.5 h-3.5" /> {editingEvent ? 'Save changes' : 'Create event'}
            </button>
            <button type="button" onClick={() => { setEventOpen(false); setEditingEvent(null); }} className="px-4 py-2 rounded-xl border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {events === null && <p className="text-xs text-slate-400 text-center py-6">Loading...</p>}
      {events !== null && visibleEvents.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
          <CalendarDays className="w-6 h-6 mx-auto text-slate-300 mb-2" />
          {canCreate ? 'No event yet. Press New event to create the first one.' : 'No event has been created yet. The Head or Regional Incharge creates events; they will appear here.'}
        </div>
      )}

      {visibleEvents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleEvents.map((e) => (
            <div key={e.id} className={`rounded-2xl border p-4 space-y-1.5 text-xs bg-white ${e.id === selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
              <button type="button" onClick={() => setSelected(e.id)} className="text-left w-full cursor-pointer">
                <p className="text-sm font-black text-slate-900">{e.name}</p>
                <p className="flex items-center gap-1.5 font-bold text-indigo-700 mt-1"><CalendarDays className="w-3.5 h-3.5" /> {day(e.date)}{e.endDate ? ` to ${day(e.endDate)}` : ''}</p>
                <p className="flex items-center gap-1.5 text-slate-600 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {e.venue}</p>
                {e.description && <p className="text-slate-500 mt-1 whitespace-pre-line">{e.description}</p>}
                <p className="text-[11px] text-slate-400 mt-1">By {e.createdBy}{e.region ? ` · ${e.region}` : ' · all regions'} · {countFor(e.id)} lead{countFor(e.id) === 1 ? '' : 's'}</p>
              </button>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {!e.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">Closed</span>}
                {canEditEvent(e) && (
                  <>
                    <button type="button" onClick={() => startEditEvent(e)} className="px-2 py-1 rounded-md border border-slate-200 font-bold flex items-center gap-1 cursor-pointer"><Pencil className="w-3 h-3" /> Edit</button>
                    <button type="button" onClick={() => run(() => eventsStorage.saveEvent({ ...e, isActive: !e.isActive }), e.isActive ? 'Event closed. No more leads can be added.' : 'Event reopened.')} className="px-2 py-1 rounded-md border border-slate-200 font-bold flex items-center gap-1 cursor-pointer">
                      {e.isActive ? <><Lock className="w-3 h-3" /> Close</> : <><Unlock className="w-3 h-3" /> Reopen</>}
                    </button>
                    <button type="button" onClick={() => setDelEvent(e)} className="px-2 py-1 rounded-md border border-rose-200 text-rose-700 font-bold flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3" /> Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {event && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
            <p className="font-bold text-slate-900 text-sm">{editingLead ? 'Edit event lead' : `Add event lead: ${event.name}`}</p>
            {!event.isActive && !editingLead ? (
              <p className="text-slate-500">This event is closed. The Head or Regional Incharge can reopen it.</p>
            ) : (
              <>
                <fieldset className="space-y-1.5">
                  <legend className={lbl}>Name category *</legend>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                      <input type="radio" name="el-cat" checked={leadForm.category === 'individual'} onChange={() => setLeadForm({ ...leadForm, category: 'individual' })} /> Individual
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                      <input type="radio" name="el-cat" checked={leadForm.category === 'company'} onChange={() => setLeadForm({ ...leadForm, category: 'company' })} /> Company name
                    </label>
                  </div>
                </fieldset>
                <div className="grid sm:grid-cols-2 gap-3">
                  {leadForm.category === 'company' && (
                    <label className={lbl}>
                      Company name *
                      <input value={leadForm.companyName} maxLength={160} onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })} className={`mt-1 ${input}`} />
                    </label>
                  )}
                  <label className={lbl}>
                    {leadForm.category === 'company' ? 'Contact person name *' : 'Person name *'}
                    <input value={leadForm.personName} maxLength={128} onChange={(e) => setLeadForm({ ...leadForm, personName: e.target.value })} className={`mt-1 ${input}`} />
                  </label>
                  <label className={lbl}>
                    Mobile number *
                    <input value={leadForm.mobile} inputMode="tel" maxLength={16} onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })} placeholder="9876543210" className={`mt-1 ${input}`} />
                  </label>
                </div>
                <label className={lbl}>
                  Narration (optional)
                  <textarea value={leadForm.narration} rows={2} maxLength={2000} onChange={(e) => setLeadForm({ ...leadForm, narration: e.target.value })} placeholder="What they are interested in, follow-up needed..." className={`mt-1 ${input}`} />
                </label>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={saveLead} className="btn-glow px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                    <Save className="w-3.5 h-3.5" /> {editingLead ? 'Save changes' : 'Add lead'}
                  </button>
                  {(editingLead || leadForm.personName || leadForm.mobile) && (
                    <button type="button" onClick={() => { setLeadForm(emptyLead()); setEditingLead(null); setError(null); }} className="px-4 py-2 rounded-xl border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900 text-sm mr-auto">Leads of this event ({shown.length}{shown.length !== eventLeads.length ? ` of ${eventLeads.length}` : ''})</p>
              <label className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile, note" className="pl-8 pr-2 py-2 border border-slate-300 rounded-lg font-semibold w-52" />
              </label>
              <select value={cat} onChange={(e) => setCat(e.target.value as '' | EventLeadCategory)} aria-label="Category" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
                <option value="">All categories</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
              </select>
              {canCreate && (
                <button type="button" onClick={exportCsv} disabled={eventLeads.length === 0} className="px-3 py-2 rounded-lg border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
              )}
            </div>
            {shown.length === 0 && <p className="text-slate-500 py-4 text-center">No leads yet for this event.</p>}
            <ul className="divide-y divide-slate-100">
              {shown.map((l) => (
                <li key={l.id} className="py-3 flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {l.category === 'company' ? <Building2 className="w-3.5 h-3.5 text-indigo-600" /> : <UserIcon className="w-3.5 h-3.5 text-emerald-600" />}
                      {l.category === 'company' ? `${l.companyName} · ${l.personName}` : l.personName}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{l.category === 'company' ? 'Company' : 'Individual'}</span>
                    </p>
                    <a href={`tel:${l.mobile}`} className="flex items-center gap-1.5 text-indigo-700 font-semibold"><Phone className="w-3 h-3" /> {formatIndianMobile(l.mobile)}</a>
                    {l.narration && <p className="text-slate-600 whitespace-pre-line">{l.narration}</p>}
                    <p className="text-[10px] text-slate-400">Added by {l.addedByName}{l.region ? ` (${l.region})` : ''} on {formatDateTime(l.createdAt)}</p>
                  </div>
                  {canEditLead(l) && (
                    <span className="flex gap-1 shrink-0">
                      <button type="button" aria-label="Edit lead" onClick={() => startEditLead(l)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" aria-label="Delete lead" onClick={() => setDelLead(l)} className="p-1.5 rounded-md border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!delLead}
        title="Delete this event lead?"
        message={`"${delLead?.personName ?? ''}" will be removed from the event.`}
        confirmLabel="Delete"
        onCancel={() => setDelLead(null)}
        onConfirm={() => {
          const t = delLead!;
          setDelLead(null);
          if (editingLead === t.id) { setEditingLead(null); setLeadForm(emptyLead()); }
          run(() => eventsStorage.deleteLead(t.id), 'Event lead deleted.');
        }}
      />
      <ConfirmModal
        isOpen={!!delEvent}
        title="Delete this event?"
        message={`"${delEvent?.name ?? ''}" and all ${leads.filter((l) => l.eventId === delEvent?.id).length} leads added to it will be removed.`}
        confirmLabel="Delete event"
        onCancel={() => setDelEvent(null)}
        onConfirm={() => {
          const t = delEvent!;
          setDelEvent(null);
          run(() => eventsStorage.deleteEvent(t.id, leads.filter((l) => l.eventId === t.id).map((l) => l.id)), 'Event deleted.');
        }}
      />
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Save, X } from 'lucide-react';
import { AwarenessProgram, User } from '../types';
import { apiService } from '../services/api';
import { formatDateTime } from '../utils/dateTime';
import { ConfirmModal } from './ConfirmModal';
import { SearchBox, SelectFilter, ClearFilters } from './FilterControls';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const empty = () => ({
  title: '',
  description: '',
  startsAt: '',
  endsAt: '',
  mode: 'online' as 'online' | 'offline',
  venue: '',
  joinLink: '',
  language: '',
  speaker: '',
  contact: '',
  isActive: true,
});

/** Awareness programme details are added here, in the admin portal only (Head and Regional Incharge) */
export const AwarenessProgramsAdmin: React.FC<Props> = ({ currentUser, onNotify }) => {
  const allowed = currentUser.role === 'head' || currentUser.role === 'regional_incharge';
  const [list, setList] = useState<AwarenessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<SaveProblem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AwarenessProgram | null>(null);
  const [q, setQ] = useState('');
  const [view, setView] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      setList(await apiService.getAwarenessPrograms());
    } catch (e) {
      setProblem(describeSaveError(e, 'The programme list could not be loaded; the list'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const set = (patch: Partial<ReturnType<typeof empty>>) => setForm((f) => ({ ...f, ...patch }));

  const validate = (): string | null => {
    if (form.title.trim().length < 4) return 'Write the programme title (at least 4 characters).';
    if (!form.startsAt) return 'Choose the date and time the programme starts.';
    if (form.endsAt && form.endsAt < form.startsAt) return 'The end time must be after the start time.';
    if (form.mode === 'offline' && form.venue.trim().length < 3) return 'Enter the venue for an in-person programme.';
    if (form.mode === 'online' && form.joinLink.trim() && !/^https:\/\/\S+$/i.test(form.joinLink.trim()))
      return 'The join link must start with https://';
    if (form.contact.trim() && !/^[+\d][\d\s-]{6,17}$/.test(form.contact.trim())) return 'Enter a valid contact phone number.';
    return null;
  };

  const save = async () => {
    setError(null);
    setProblem(null);
    const v = validate();
    if (v) return setError(v);
    setSaving(true);
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      startsAt: form.startsAt,
      endsAt: form.endsAt || undefined,
      mode: form.mode,
      venue: form.mode === 'offline' ? form.venue.trim() : undefined,
      joinLink: form.mode === 'online' && form.joinLink.trim() ? form.joinLink.trim() : undefined,
      language: form.language.trim() || undefined,
      speaker: form.speaker.trim() || undefined,
      contact: form.contact.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        // fields cleared in the form must be removed from the saved programme
        await apiService.updateAwarenessProgram(editingId, {
          ...data,
          endsAt: data.endsAt ?? '',
          venue: data.venue ?? '',
          joinLink: data.joinLink ?? '',
          language: data.language ?? '',
          speaker: data.speaker ?? '',
          contact: data.contact ?? '',
        });
        onNotify?.('Awareness programme updated.');
      } else {
        await apiService.createAwarenessProgram(data, currentUser.name);
        onNotify?.('Awareness programme added. Customers can see it now.');
      }
      setForm(empty());
      setEditingId(null);
      await load();
    } catch (e) {
      setProblem(describeSaveError(e, 'The programme'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: AwarenessProgram) => {
    setError(null);
    setProblem(null);
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || '',
      startsAt: p.startsAt,
      endsAt: p.endsAt || '',
      mode: p.mode,
      venue: p.venue || '',
      joinLink: p.joinLink || '',
      language: p.language || '',
      speaker: p.speaker || '',
      contact: p.contact || '',
      isActive: p.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (p: AwarenessProgram) => {
    try {
      await apiService.updateAwarenessProgram(p.id, { isActive: !p.isActive });
      await load();
    } catch (e) {
      setProblem(describeSaveError(e, 'The change'));
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    try {
      await apiService.deleteAwarenessProgram(target.id);
      if (editingId === target.id) {
        setEditingId(null);
        setForm(empty());
      }
      onNotify?.('Awareness programme deleted.', 'info');
      await load();
    } catch (e) {
      setProblem(describeSaveError(e, 'The deletion'));
    }
  };

  const now = Date.now();
  const isPast = (p: AwarenessProgram) => new Date(p.endsAt || p.startsAt).getTime() + 3 * 3600 * 1000 < now;
  const shown = useMemo(
    () =>
      list.filter((p) => {
        if (view === 'UPCOMING' && (isPast(p) || !p.isActive)) return false;
        if (view === 'PAST' && !isPast(p)) return false;
        if (view === 'HIDDEN' && p.isActive) return false;
        const t = q.trim().toLowerCase();
        return !t || [p.title, p.description, p.venue, p.speaker, p.language].some((x) => (x || '').toLowerCase().includes(t));
      }),
    [list, q, view]
  );

  if (!allowed) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
        Only the Head Incharge and Regional Incharge can manage awareness programmes.
      </div>
    );
  }

  const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg';
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" /> Awareness Programs
          </div>
          <h2 className="text-lg font-black text-slate-900">Add awareness programme details</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Programmes you add here appear for customers (Awareness Programs tab) and on the Home Screen. They can only be added from this admin portal.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {problem ? (
        <SaveErrorNotice problem={problem} />
      ) : (
        error && (
          <p role="alert" className="text-xs font-semibold text-rose-600">
            {error}
          </p>
        )
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <p className="font-bold text-slate-900 text-sm">{editingId ? 'Edit programme' : 'New programme'}</p>
        <input aria-label="Programme title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Programme title, e.g. Mutual Fund Awareness Webinar" className={input} />
        <textarea aria-label="Programme details" value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} placeholder="What will be covered, who should attend, what to bring" className={input} />
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block font-bold text-slate-700 uppercase tracking-wider">
            Starts
            <input aria-label="Starts at" type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <label className="block font-bold text-slate-700 uppercase tracking-wider">
            Ends (optional)
            <input aria-label="Ends at" type="datetime-local" value={form.endsAt} onChange={(e) => set({ endsAt: e.target.value })} className={`mt-1 ${input}`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-semibold text-slate-700">
          <span className="font-bold uppercase tracking-wider text-slate-700">How it is held</span>
          {(['online', 'offline'] as const).map((m) => (
            <label key={m} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="aw-mode" checked={form.mode === m} onChange={() => set({ mode: m })} />
              {m === 'online' ? 'Online' : 'In person'}
            </label>
          ))}
        </div>
        {form.mode === 'online' ? (
          <input aria-label="Join link" value={form.joinLink} onChange={(e) => set({ joinLink: e.target.value })} placeholder="Join link (https://...) - optional" className={input} />
        ) : (
          <input aria-label="Venue" value={form.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Venue and address" className={input} />
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <input aria-label="Speaker" value={form.speaker} onChange={(e) => set({ speaker: e.target.value })} placeholder="Speaker (optional)" className={input} />
          <input aria-label="Language" value={form.language} onChange={(e) => set({ language: e.target.value })} placeholder="Language (optional)" className={input} />
          <input aria-label="Contact phone" value={form.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="Contact phone (optional)" className={input} />
        </div>
        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
          Show this programme to customers
        </label>
        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty()); setError(null); }} className="btn-glow px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer">
            {editingId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : editingId ? 'Save programme' : 'Add programme'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search programmes" />
        <SelectFilter
          value={view}
          onChange={setView}
          allLabel="All programmes"
          options={[
            { value: 'UPCOMING', label: 'Upcoming (shown)' },
            { value: 'PAST', label: 'Completed' },
            { value: 'HIDDEN', label: 'Hidden' },
          ]}
        />
        <ClearFilters show={q !== '' || view !== 'ALL'} onClick={() => { setQ(''); setView('ALL'); }} />
      </div>

      <div className="space-y-3">
        {loading && <p className="text-xs text-slate-400 text-center py-4">Loading...</p>}
        {!loading && shown.length === 0 && <p className="text-xs text-slate-500 text-center py-6">No programmes found.</p>}
        {shown.map((p) => (
          <div key={p.id} className="lift-card bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-start gap-3 text-xs">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-black text-slate-900">{p.title}</p>
              <p className="font-bold text-indigo-700">
                {formatDateTime(p.startsAt)}
                {p.endsAt ? ` to ${formatDateTime(p.endsAt)}` : ''} • {p.mode === 'online' ? 'Online' : `In person${p.venue ? `, ${p.venue}` : ''}`}
              </p>
              {p.description && <p className="text-slate-600 whitespace-pre-line">{p.description}</p>}
              <p className="text-[11px] text-slate-500">
                {[p.speaker && `Speaker: ${p.speaker}`, p.language && `Language: ${p.language}`, p.contact && `Contact: ${p.contact}`].filter(Boolean).join(' • ')}
              </p>
              <p className="flex flex-wrap gap-1.5 pt-1">
                <span className={`px-2 py-0.5 rounded-full font-bold border ${p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {p.isActive ? 'Shown to customers' : 'Hidden'}
                </span>
                {isPast(p) && <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">Completed</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => toggleActive(p)} title={p.isActive ? 'Hide from customers' : 'Show to customers'} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-slate-700 bg-slate-50 border border-slate-200 flex items-center gap-1 cursor-pointer">
                {p.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {p.isActive ? 'Hide' : 'Show'}
              </button>
              <button type="button" onClick={() => startEdit(p)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 flex items-center gap-1 cursor-pointer">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button type="button" onClick={() => setToDelete(p)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Delete this programme?"
        message={`"${toDelete?.title}" will be removed for everyone.`}
        confirmLabel="Delete programme"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

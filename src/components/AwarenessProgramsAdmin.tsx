import React, { useEffect, useMemo, useState } from 'react';
import { Link2, ScanLine, Users, Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Save, X } from 'lucide-react';
import { AwarenessProgram, AwarenessSection, SessionRegistration, User } from '../types';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { IdScanner } from './IdScanner';
import { prepareAdImage } from '../services/adsStorage';
import { apiService } from '../services/api';
import { formatDateTime } from '../utils/dateTime';
import { ConfirmModal } from './ConfirmModal';
import { SearchBox, SelectFilter, ClearFilters } from './FilterControls';
import { isHqRegion, getAllRegions } from '../utils/regions';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const STANDARD_PAGES = ['Speakers', 'Download Brochure', 'Program Schedule', 'Call for Papers', 'Themes', 'Conference Enquiry', 'FAQ'];

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
  imageUrl: '',
  sections: [] as AwarenessSection[],
  isPaid: false,
  fee: '',
  freeFirst: '',
  maxRegistrations: '',
  gpayNumber: '',
  gpayName: '',
  isActive: true,
});

/** Awareness programme details are added here, in the admin portal only (Head, Regional Incharge and Area Incharge) */
export const AwarenessProgramsAdmin: React.FC<Props> = ({ currentUser, onNotify }) => {
  const isHead = currentUser.role === 'head';
  const allowed = isHead || currentUser.role === 'regional_incharge' || currentUser.role === 'area_incharge';
  const ownRegion = isHqRegion(currentUser.region) ? '' : currentUser.region;
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState(isHead ? '' : ownRegion);
  /** Head: everything. Regional Incharge: programmes of their division. Area Incharge: only programmes they added. */
  const canModify = (p: AwarenessProgram) =>
    isHead ||
    p.createdById === currentUser.id ||
    (currentUser.role === 'regional_incharge' && !!ownRegion && p.region === ownRegion);
  const [list, setList] = useState<AwarenessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regs, setRegs] = useState<SessionRegistration[]>([]);
  const [proof, setProof] = useState<string | null>(null);
  const [scan, setScan] = useState(false);
  const [openRegs, setOpenRegs] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState(() => {
    try {
      return localStorage.getItem('ads_site_url') || '';
    } catch (_e) {
      return '';
    }
  });
  const loadRegs = () => sessionRegStorage.list().then(setRegs).catch(() => undefined);
  useEffect(() => {
    loadRegs();
  }, []);
  const saveSiteUrl = (v: string) => {
    setSiteUrl(v);
    try {
      localStorage.setItem('ads_site_url', v.trim());
    } catch (_e) {
      /* ignore */
    }
  };
  const linkFor = (p: AwarenessProgram) => `${siteUrl.trim().replace(/\/+$/, '').replace(/#.*$/, '')}/#/register/${encodeURIComponent(p.id)}`;
  const copyLink = async (p: AwarenessProgram) => {
    if (!/^https?:\/\//i.test(siteUrl.trim())) return onNotify?.('First type the address of the advertising website (starts with https://) above the list.', 'error');
    try {
      await navigator.clipboard.writeText(linkFor(p));
      onNotify?.('Registration link copied. Share it with customers and members.', 'success');
    } catch (_e) {
      window.prompt('Copy this registration link', linkFor(p));
    }
  };
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
  useEffect(() => {
    if (allowed && isHead) apiService.getRegions().then((r: string[]) => setRegions(getAllRegions([], [], r))).catch(() => setRegions(getAllRegions()));
  }, [allowed, isHead]);

  const setSec = (i: number, patch: Partial<AwarenessSection>) => setForm((f) => ({ ...f, sections: f.sections.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
  const moveSec = (i: number, d: number) =>
    setForm((f) => {
      const a = [...f.sections];
      const j = i + d;
      if (j < 0 || j >= a.length) return f;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...f, sections: a };
    });
  const pickFile = (i: number, file: File) => {
    if (file.size > 450 * 1024) return setError('This file is larger than 450 KB. Upload a smaller file or paste a link instead.');
    const r = new FileReader();
    r.onload = () => setSec(i, { fileUrl: String(r.result), fileName: file.name });
    r.onerror = () => setError('Could not read the file.');
    r.readAsDataURL(file);
  };
  const set = (patch: Partial<ReturnType<typeof empty>>) => setForm((f) => ({ ...f, ...patch }));

  const validate = (): string | null => {
    if (form.title.trim().length < 4) return 'Write the programme title (at least 4 characters).';
    if (!form.startsAt) return 'Choose the date and time the programme starts.';
    if (form.endsAt && form.endsAt < form.startsAt) return 'The end time must be after the start time.';
    if (!isHead && !ownRegion) return 'Your account has no division set, so a programme cannot be added. Ask the Head Incharge to set it.';
    if (form.mode === 'offline' && form.venue.trim().length < 3) return 'Enter the venue for an in-person programme.';
    if (form.mode === 'online' && form.joinLink.trim() && !/^https:\/\/\S+$/i.test(form.joinLink.trim()))
      return 'The join link must start with https://';
    if (form.contact.trim() && !/^[+\d][\d\s-]{6,17}$/.test(form.contact.trim())) return 'Enter a valid contact phone number.';
    if (form.sections.some((x) => x.linkUrl?.trim() && !/^https:\/\/\S+$/i.test(x.linkUrl.trim()))) return 'A page link must start with https://';
    if (form.imageUrl.length + form.sections.reduce((n, x) => n + (x.fileUrl?.length || 0) + (x.body?.length || 0), 0) > 850000) return 'The poster and uploaded files are too large together. Remove a file or use a link instead.';
    if (form.isPaid) {
      if (!(Number(form.fee) > 0)) return 'Enter the fee of the paid session.';
      if (form.freeFirst !== '' && !(Number.isInteger(Number(form.freeFirst)) && Number(form.freeFirst) >= 0)) return 'First free registrations must be a whole number.';
      if (!/^[6-9]\d{9}$/.test(form.gpayNumber.replace(/[\s-]/g, '').replace(/^\+?91/, ''))) return 'Enter a valid 10 digit GPay number.';
    }
    if (form.maxRegistrations !== '' && !(Number.isInteger(Number(form.maxRegistrations)) && Number(form.maxRegistrations) >= 1)) return 'The registration limit must be a whole number of 1 or more.';
    if (form.isPaid && form.freeFirst !== '' && form.maxRegistrations !== '' && Number(form.freeFirst) > Number(form.maxRegistrations)) return 'First free registrations cannot be more than the registration limit.';
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
      imageUrl: form.imageUrl || undefined,
      sections: form.sections.filter((x) => x.title.trim()).map((x) => ({ id: x.id, title: x.title.trim(), body: x.body?.trim() || undefined, linkUrl: x.linkUrl?.trim() || undefined, fileUrl: x.fileUrl || undefined, fileName: x.fileName || undefined })),
      isPaid: form.isPaid,
      fee: form.isPaid ? Number(form.fee) : undefined,
      freeFirst: form.isPaid && form.freeFirst !== '' && Number(form.freeFirst) > 0 ? Number(form.freeFirst) : undefined,
      maxRegistrations: form.maxRegistrations !== '' ? Number(form.maxRegistrations) : undefined,
      gpayNumber: form.isPaid ? form.gpayNumber.replace(/[\s-]/g, '').replace(/^\+?91/, '') : undefined,
      gpayName: form.isPaid && form.gpayName.trim() ? form.gpayName.trim() : undefined,
      isActive: form.isActive,
      region: isHead ? region : ownRegion,
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
          imageUrl: data.imageUrl ?? '',
          sections: data.sections ?? [],
          fee: data.fee ?? 0,
          freeFirst: data.freeFirst ?? 0,
          maxRegistrations: data.maxRegistrations ?? 0,
          gpayNumber: data.gpayNumber ?? '',
          gpayName: data.gpayName ?? '',
          region: data.region,
        });
        onNotify?.('Awareness programme updated.');
      } else {
        await apiService.createAwarenessProgram({ ...data, createdByRole: currentUser.role, createdById: currentUser.id }, currentUser.name);
        onNotify?.('Awareness programme added. Customers can see it now.');
      }
      setForm(empty());
      setRegion(isHead ? '' : ownRegion);
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
      imageUrl: p.imageUrl || '',
      sections: p.sections || [],
      isPaid: !!p.isPaid,
      fee: p.fee ? String(p.fee) : '',
      freeFirst: p.freeFirst ? String(p.freeFirst) : '',
      maxRegistrations: p.maxRegistrations ? String(p.maxRegistrations) : '',
      gpayNumber: p.gpayNumber || '',
      gpayName: p.gpayName || '',
      isActive: p.isActive,
    });
    setRegion(isHead ? p.region || '' : ownRegion);
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
        Only the Head, Regional and Area Incharges can manage awareness programmes.
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
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => setScan((v) => !v)} className="btn-glow px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <ScanLine className="w-3.5 h-3.5" /> Scan QR code
          </button>
          <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>
      {scan && <IdScanner programs={list} by={currentUser.name} onChanged={loadRegs} onClose={() => setScan(false)} />}

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
        <div className="space-y-1.5">
          <p className="font-bold text-slate-700">Event poster / banner picture (shown on the event page and cards)</p>
          {form.imageUrl && <img src={form.imageUrl} alt="Event poster" className="max-h-40 rounded-lg border border-slate-200" />}
          <div className="flex flex-wrap gap-2">
            <label className="btn-glow px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer">
              {form.imageUrl ? 'Change poster' : 'Upload poster'}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) prepareAdImage(file).then((u) => set({ imageUrl: u })).catch((er) => setError(er instanceof Error ? er.message : 'Could not read the picture.')); }} />
            </label>
            {form.imageUrl && <button type="button" onClick={() => set({ imageUrl: '' })} className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold cursor-pointer">Remove poster</button>}
          </div>
        </div>
        <div className="space-y-2 border border-slate-200 rounded-xl p-3">
          <p className="font-bold text-slate-700">Event page menu (shown on the left of the page that opens with Know more)</p>
          <p className="text-[11px] text-slate-500">Home (details) and Registration are always there. Add pages such as Speakers, Download Brochure, Program Schedule, Call for Papers, Themes, Conference Enquiry, FAQ.</p>
          {form.sections.map((sec, i) => (
            <div key={sec.id} className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input aria-label="Page title" value={sec.title} onChange={(e) => setSec(i, { title: e.target.value })} placeholder="Page name, e.g. Speakers" className={input} />
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveSec(i, -1)} className="px-2 rounded-lg border border-slate-300 disabled:opacity-40 cursor-pointer">↑</button>
                <button type="button" aria-label="Move down" disabled={i === form.sections.length - 1} onClick={() => moveSec(i, 1)} className="px-2 rounded-lg border border-slate-300 disabled:opacity-40 cursor-pointer">↓</button>
                <button type="button" aria-label="Remove page" onClick={() => set({ sections: form.sections.filter((_, k) => k !== i) })} className="px-2 rounded-lg border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea aria-label="Page text" rows={3} value={sec.body || ''} onChange={(e) => setSec(i, { body: e.target.value })} placeholder="Text of this page (a blank line starts a new paragraph). Leave empty to show Will be updated soon." className={input} />
              <input aria-label="Page link" value={sec.linkUrl || ''} onChange={(e) => setSec(i, { linkUrl: e.target.value })} placeholder="Button link (https://...) - optional" className={input} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer">
                  {sec.fileUrl ? 'Change file' : 'Upload PDF / file'}
                  <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) pickFile(i, file); }} />
                </label>
                {sec.fileUrl && <span className="font-semibold text-emerald-700">{sec.fileName || 'File uploaded'}</span>}
                {sec.fileUrl && <button type="button" onClick={() => setSec(i, { fileUrl: '', fileName: '' })} className="text-rose-700 font-bold cursor-pointer">Remove file</button>}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => set({ sections: [...form.sections, { id: `s_${Date.now()}_${form.sections.length}`, title: '' }] })} className="px-3 py-2 rounded-xl border border-blue-300 text-blue-800 font-bold cursor-pointer">+ Add page</button>
            <button type="button" onClick={() => set({ sections: [...form.sections, ...STANDARD_PAGES.filter((t) => !form.sections.some((x) => x.title === t)).map((t, k) => ({ id: `s_${Date.now()}_${k}`, title: t }))] })} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer">Add standard pages</button>
          </div>
        </div>
        <label className="flex items-center gap-2 font-bold text-slate-700">
          <input type="checkbox" checked={form.isPaid} onChange={(e) => set({ isPaid: e.target.checked })} /> Paid session (members pay and upload the payment screenshot)
        </label>
        {form.isPaid && (
          <div className="grid sm:grid-cols-2 gap-3 bg-emerald-50/50 border border-emerald-200 rounded-xl p-3">
            <input aria-label="Fee" type="number" min={1} value={form.fee} onChange={(e) => set({ fee: e.target.value })} placeholder="Fee in rupees" className={input} />
            <input aria-label="GPay number" value={form.gpayNumber} onChange={(e) => set({ gpayNumber: e.target.value })} placeholder="GPay number to pay" className={input} />
            <input aria-label="GPay name" value={form.gpayName} onChange={(e) => set({ gpayName: e.target.value })} placeholder="Name on GPay (optional)" className={input} />
            <input aria-label="First free registrations" type="number" min={0} value={form.freeFirst} onChange={(e) => set({ freeFirst: e.target.value })} placeholder="First how many registrations are free? (optional, for example 50)" className={`${input} sm:col-span-2`} />
          </div>
        )}
        <input aria-label="Registration limit" type="number" min={1} value={form.maxRegistrations} onChange={(e) => set({ maxRegistrations: e.target.value })} placeholder="Registration limit - total seats (optional, empty = no limit)" className={input} />
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <label className="block font-bold text-slate-700 uppercase tracking-wider">
            Who can see it
            {isHead ? (
              <select aria-label="Programme region" value={region} onChange={(e) => setRegion(e.target.value)} className={`mt-1 ${input} bg-white`}>
                <option value="">All regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <p className="mt-1 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-50 border border-slate-200 normal-case">
                {ownRegion ? `Customers of ${ownRegion}` : 'No division set on your account'}
              </p>
            )}
          </label>
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


      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
        Advertising website address (used to make each session's registration link)
        <input value={siteUrl} onChange={(e) => saveSiteUrl(e.target.value)} placeholder="https://your-ads-site.vercel.app" className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 text-xs normal-case font-normal" />
      </label>

      <div className="space-y-3">
        {loading && <p className="text-xs text-slate-400 text-center py-4">Loading...</p>}
        {!loading && shown.length === 0 && <p className="text-xs text-slate-500 text-center py-6">No programmes found.</p>}
        {shown.map((p) => (
          <div key={p.id} className="lift-card bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-start gap-3 text-xs">
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
                {p.isPaid && <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid ₹{p.fee}{p.freeFirst ? ` (first ${p.freeFirst} free)` : ''}</span>}
                {p.maxRegistrations ? <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">{regs.filter((r) => r.programId === p.id).length}/{p.maxRegistrations} seats</span> : null}
                <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{p.region || 'All regions'}</span>
                {p.createdBy && <span className="px-2 py-0.5 rounded-full font-bold bg-slate-50 text-slate-600 border border-slate-200">Added by {p.createdBy}</span>}
                {isPast(p) && <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">Completed</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button type="button" onClick={() => copyLink(p)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1 cursor-pointer">
                <Link2 className="w-3.5 h-3.5" /> Copy link
              </button>
              <button type="button" onClick={() => setOpenRegs(openRegs === p.id ? null : p.id)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-slate-700 bg-slate-50 border border-slate-200 flex items-center gap-1 cursor-pointer">
                <Users className="w-3.5 h-3.5" /> Registrations ({regs.filter((r) => r.programId === p.id).length})
              </button>
            </div>
            {canModify(p) ? (
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
            ) : (
              <p className="text-[11px] font-semibold text-slate-400 shrink-0">View only</p>
            )}
            {openRegs === p.id && (
              <div className="w-full basis-full border-t border-slate-100 pt-3 space-y-1.5">
                {regs.filter((r) => r.programId === p.id).length === 0 && <p className="text-slate-500">No one has registered yet.</p>}
                {regs.filter((r) => r.programId === p.id).map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <p className="min-w-0">
                      <b>{r.name}</b> ({r.attendeeType}){r.present ? <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Present</span> : null} • <a href={`tel:${r.mobile}`} className="text-indigo-700 font-bold">{r.mobile}</a>
                      {r.email ? ` • ${r.email}` : ''}{r.city ? ` • ${r.city}` : ''}{r.guests ? ` • +${r.guests} guest${r.guests > 1 ? 's' : ''}` : ''}
                      {r.note ? <span className="block text-slate-500">{r.note}</span> : null}
                      {r.amount ? <span className="block font-bold text-emerald-700">Paid ₹{r.amount}</span> : null}
                      {r.paymentProof ? (
                        <button type="button" onClick={() => setProof(r.id)} className="text-indigo-700 font-bold cursor-pointer">View payment screenshot</button>
                      ) : null}
                    </p>
                    <button type="button" onClick={() => sessionRegStorage.remove(r.id).then(loadRegs).catch((e) => onNotify?.(e.message, 'error'))} className="text-rose-600 font-bold cursor-pointer shrink-0">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {proof && regs.find((r) => r.id === proof)?.paymentProof && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-3" onClick={() => setProof(null)}>
          <button type="button" aria-label="Close" className="absolute top-3 right-3 p-2 rounded-full bg-white text-slate-900 cursor-pointer"><X className="w-5 h-5" /></button>
          <img src={regs.find((r) => r.id === proof)?.paymentProof} alt="Payment screenshot" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

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

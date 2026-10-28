import React, { useEffect, useRef, useState } from 'react';
import { LayoutList, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Save, X, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { SiteContact, SiteItem, SiteItemKind, SiteMenu, SiteRoute, User } from '../types';
import { siteStorage } from '../services/siteStorage';
import { prepareAdImage } from '../services/adsStorage';
import { DEFAULT_ITEMS, DEFAULT_MENUS, SITE_ROUTE_LABELS } from '../utils/siteDefaults';
import { findBannedClaim } from '../utils/fundAdRules';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const newId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
const emptyItem = (menuId = '') => ({
  menuId,
  section: '',
  title: '',
  description: '',
  badge: '' as SiteItem['badge'],
  kind: 'page' as SiteItemKind,
  body: '',
  imageUrl: '',
  linkUrl: '',
  route: 'funds' as SiteRoute,
  isActive: true,
});

const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg';
const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';

/** Menus, sub menus and pages of the advertising website. Only Head and Regional Incharge can add, edit, hide and delete them. */
export const SiteContentManagement: React.FC<Props> = ({ currentUser, onNotify }) => {
  const allowed = currentUser.role === 'head' || currentUser.role === 'regional_incharge';
  const [menus, setMenus] = useState<SiteMenu[]>([]);
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [menuName, setMenuName] = useState('');
  const [menuEdit, setMenuEdit] = useState<{ id: string; label: string } | null>(null);
  const [form, setForm] = useState(emptyItem());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [delItem, setDelItem] = useState<SiteItem | null>(null);
  const [delMenu, setDelMenu] = useState<SiteMenu | null>(null);
  const [contact, setContact] = useState<SiteContact>({ contactName: '', mobile: '', email: '', officeAddress: '', hours: '' });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([siteStorage.getMenus(), siteStorage.getItems()]);
      setMenus(m);
      setItems(i);
      const c = await siteStorage.getContact().catch(() => null);
      if (c) setContact(c);
      setError(null);
    } catch (_e) {
      setError('Could not read the menus from the online database.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn();
      if (ok) onNotify?.(ok, 'success');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const set = (p: Partial<ReturnType<typeof emptyItem>>) => setForm((f) => ({ ...f, ...p }));
  const reset = () => {
    setForm(emptyItem(filter || menus[0]?.id || ''));
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveContact = () => {
    const mobile = contact.mobile.replace(/[^0-9+]/g, '');
    if (mobile && !/^(\+91)?[6-9][0-9]{9}$/.test(mobile)) return setError('Type a valid 10 digit mobile number (with or without +91).');
    if (contact.email.trim() && !/^\S+@\S+\.\S+$/.test(contact.email.trim())) return setError('Type a valid e-mail address.');
    run(
      () =>
        siteStorage.saveContact({
          contactName: contact.contactName.trim(),
          mobile,
          email: contact.email.trim(),
          officeAddress: contact.officeAddress.trim(),
          hours: contact.hours.trim(),
          updatedBy: currentUser.name,
        }),
      'Contact details saved. The Contact Us page shows them now.'
    );
  };

  const addMenu = () => {
    const label = menuName.trim();
    if (label.length < 2) return setError('Type a name for the new menu.');
    run(async () => {
      await siteStorage.saveMenu({ id: newId('menu'), label, order: menus.length + 1, isActive: true, highlight: false, createdAt: new Date().toISOString() });
      setMenuName('');
    }, 'Menu added.');
  };

  const saveMenuName = () => {
    if (!menuEdit) return;
    const label = menuEdit.label.trim();
    if (label.length < 2) return setError('The menu name needs at least 2 letters.');
    const id = menuEdit.id;
    setMenuEdit(null);
    run(() => siteStorage.patchMenu(id, { label }), 'Menu renamed.');
  };

  const moveMenu = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= menus.length) return;
    const a = menus[i];
    const b = menus[j];
    run(async () => {
      await siteStorage.patchMenu(a.id, { order: j + 1 });
      await siteStorage.patchMenu(b.id, { order: i + 1 });
    });
  };

  const shown = items.filter((x) => !filter || x.menuId === filter);

  const moveItem = (x: SiteItem, d: -1 | 1) => {
    const group = items.filter((y) => y.menuId === x.menuId && y.section === x.section);
    const i = group.findIndex((y) => y.id === x.id);
    const o = group[i + d];
    if (!o) return;
    run(async () => {
      await siteStorage.patchItem(x.id, { order: o.order });
      await siteStorage.patchItem(o.id, { order: x.order });
    });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(jpe?g|png|gif)$/i.test(f.name)) return setError('Please upload a JPG, PNG or GIF image.');
    try {
      set({ imageUrl: await prepareAdImage(f) });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process this image.');
    }
  };

  const validate = (): string | null => {
    if (!form.menuId) return 'Choose the menu this page belongs to (add a menu first).';
    if (form.section.trim().length < 2) return 'Type the heading of the column, for example "Mutual Fund Basics".';
    if (form.title.trim().length < 2) return 'Type the page title.';
    if (form.kind === 'link' && !/^https:\/\/\S+$/i.test(form.linkUrl.trim())) return 'The link must start with https://';
    if (form.kind === 'page' && form.badge !== 'Coming Soon' && form.body.trim().length < 5) return 'Write the page text (or mark it Coming Soon).';
    const bad = findBannedClaim(form.title, form.description, form.body);
    if (bad) return `"${bad}" cannot be used. Do not promise or guarantee returns in a mutual fund promotion.`;
    return null;
  };

  const save = async () => {
    const v = validate();
    if (v) return setError(v);
    setSaving(true);
    const old = items.find((x) => x.id === editingId);
    const inSection = items.filter((x) => x.menuId === form.menuId && x.section === form.section.trim());
    const item: SiteItem = {
      id: editingId || newId('item'),
      menuId: form.menuId,
      section: form.section.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      badge: form.badge || '',
      kind: form.kind,
      body: form.kind === 'page' ? form.body.trim() : '',
      imageUrl: form.imageUrl,
      linkUrl: form.kind === 'link' ? form.linkUrl.trim() : '',
      route: form.kind === 'route' ? form.route : undefined,
      order: old ? old.order : (items.reduce((m, x) => Math.max(m, x.order), 0) || inSection.length) + 1,
      isActive: form.isActive,
      createdAt: old?.createdAt || new Date().toISOString(),
      createdBy: old?.createdBy || currentUser.name,
    };
    await run(() => siteStorage.saveItem(item), old ? 'Page updated.' : 'Page added to the website.');
    setSaving(false);
    reset();
  };

  const startEdit = (x: SiteItem) => {
    setEditingId(x.id);
    setError(null);
    setForm({
      menuId: x.menuId,
      section: x.section,
      title: x.title,
      description: x.description || '',
      badge: x.badge || '',
      kind: x.kind,
      body: x.body || '',
      imageUrl: x.imageUrl || '',
      linkUrl: x.linkUrl || '',
      route: x.route || 'funds',
      isActive: x.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!allowed) {
    return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">Only the Head Incharge and Regional Incharge can manage the advertising website menus.</div>;
  }

  const sections = Array.from(new Set(items.filter((x) => x.menuId === form.menuId).map((x) => x.section)));
  const menuName_ = (id: string) => menus.find((m) => m.id === id)?.label || '(deleted menu)';

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <LayoutList className="w-4 h-4" /> Advertising Website Menus
          </div>
          <h2 className="text-lg font-black text-slate-900">Top menus, sub menus and promotion pages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Everything here appears on the public advertising website. Add, rename, hide or delete menus, and write the investment guide and promotion pages under them. Mutual fund offers are added in <b>Mutual Fund Ads</b>.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      {!loading && menus.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-xs text-indigo-900 space-y-3">
          <p className="font-bold">The website is showing a built-in starter menu. Load it here to edit, rename or delete its entries.</p>
          <button
            type="button"
            onClick={() => run(() => siteStorage.seed(DEFAULT_MENUS, DEFAULT_ITEMS, currentUser.name), 'Starter menu loaded. You can edit everything now.')}
            className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Load starter menu
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <p className="font-bold text-slate-900 text-sm">Contact Us details</p>
        <p className="text-slate-500">Shown on the Contact Us page of the website (name, mobile number, e-mail, office and hours).</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={lbl}>
            Contact person name
            <input value={contact.contactName} maxLength={100} onChange={(e) => setContact({ ...contact, contactName: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Mobile number
            <input value={contact.mobile} maxLength={14} inputMode="tel" onChange={(e) => setContact({ ...contact, mobile: e.target.value })} placeholder="9876543210" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            E-mail
            <input value={contact.email} maxLength={120} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Phone hours
            <input value={contact.hours} maxLength={120} onChange={(e) => setContact({ ...contact, hours: e.target.value })} placeholder="Mon-Sat, 9 am to 6 pm" className={`mt-1 ${input}`} />
          </label>
        </div>
        <label className={lbl}>
          Office address
          <textarea value={contact.officeAddress} rows={3} maxLength={400} onChange={(e) => setContact({ ...contact, officeAddress: e.target.value })} className={`mt-1 ${input}`} />
        </label>
        <button type="button" onClick={saveContact} className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1.5 cursor-pointer">
          <Save className="w-3.5 h-3.5" /> Save contact details
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <p className="font-bold text-slate-900 text-sm">Top menus</p>
        <ul className="divide-y divide-slate-100">
          {menus.map((m, i) => (
            <li key={m.id} className="py-2 flex flex-wrap items-center gap-2">
              {menuEdit?.id === m.id ? (
                <>
                  <input value={menuEdit.label} maxLength={40} onChange={(e) => setMenuEdit({ id: m.id, label: e.target.value })} className={`${input} max-w-xs`} />
                  <button type="button" onClick={saveMenuName} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer">Save</button>
                  <button type="button" onClick={() => setMenuEdit(null)} className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold cursor-pointer">Cancel</button>
                </>
              ) : (
                <>
                  <span className={`font-bold ${m.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{m.label}</span>
                  <span className="text-slate-400">({items.filter((x) => x.menuId === m.id).length} pages)</span>
                  {m.highlight && <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">Button</span>}
                  <span className="ml-auto flex items-center gap-1">
                    <button type="button" aria-label="Move up" onClick={() => moveMenu(i, -1)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" aria-label="Move down" onClick={() => moveMenu(i, 1)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => run(() => siteStorage.patchMenu(m.id, { highlight: !m.highlight }))} className="px-2 py-1.5 rounded-md border border-slate-200 font-bold cursor-pointer">{m.highlight ? 'Make plain' : 'Make button'}</button>
                    <button type="button" aria-label={m.isActive ? 'Hide menu' : 'Show menu'} onClick={() => run(() => siteStorage.patchMenu(m.id, { isActive: !m.isActive }))} className="p-1.5 rounded-md border border-slate-200 cursor-pointer">{m.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                    <button type="button" aria-label="Rename menu" onClick={() => setMenuEdit({ id: m.id, label: m.label })} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" aria-label="Delete menu" onClick={() => setDelMenu(m)} className="p-1.5 rounded-md border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input value={menuName} maxLength={40} onChange={(e) => setMenuName(e.target.value)} placeholder="New menu name, e.g. Investor Guide" className={`${input} max-w-sm`} />
          <button type="button" onClick={addMenu} className="btn-glow px-3.5 py-2 rounded-lg bg-indigo-600 text-white font-bold flex items-center gap-1.5 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add menu</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <p className="font-bold text-slate-900 text-sm">{editingId ? 'Edit page' : 'New sub menu page'}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={lbl}>
            Top menu *
            <select value={form.menuId} onChange={(e) => set({ menuId: e.target.value })} className={`mt-1 ${input} bg-white`}>
              <option value="">Choose...</option>
              {menus.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label className={lbl}>
            Column heading *
            <input list="site-sections" value={form.section} maxLength={50} onChange={(e) => set({ section: e.target.value })} placeholder="e.g. Mutual Fund Basics" className={`mt-1 ${input}`} />
            <datalist id="site-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label className={lbl}>
            Title *
            <input value={form.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Short line under the title
            <input value={form.description} maxLength={120} onChange={(e) => set({ description: e.target.value })} className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Tag
            <select value={form.badge || ''} onChange={(e) => set({ badge: e.target.value as SiteItem['badge'] })} className={`mt-1 ${input} bg-white`}>
              <option value="">None</option>
              <option>New</option>
              <option>Coming Soon</option>
            </select>
          </label>
          <label className={lbl}>
            What it opens
            <select value={form.kind} onChange={(e) => set({ kind: e.target.value as SiteItemKind })} className={`mt-1 ${input} bg-white`}>
              <option value="page">A page of text and picture</option>
              <option value="link">An outside website link</option>
              <option value="route">A part of this website</option>
              <option value="calculator">The investment calculators</option>
            </select>
          </label>
        </div>
        {form.kind === 'page' && (
          <label className={lbl}>
            Page text
            <textarea value={form.body} rows={7} maxLength={6000} onChange={(e) => set({ body: e.target.value })} placeholder="Write the guide or promotion. A blank line starts a new paragraph." className={`mt-1 ${input}`} />
          </label>
        )}
        {form.kind === 'link' && (
          <label className={lbl}>
            Link (https)
            <input value={form.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} placeholder="https://..." className={`mt-1 ${input}`} />
          </label>
        )}
        {form.kind === 'route' && (
          <label className={lbl}>
            Opens
            <select value={form.route} onChange={(e) => set({ route: e.target.value as SiteRoute })} className={`mt-1 ${input} bg-white`}>
              {Object.entries(SITE_ROUTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        )}
        {form.kind === 'page' && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-glow px-3.5 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {form.imageUrl ? 'Replace picture' : 'Add picture (optional)'}
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif" onChange={onFile} className="hidden" />
            {form.imageUrl && (
              <>
                <img src={form.imageUrl} alt="" className="h-14 rounded-md border border-slate-200" />
                <button type="button" onClick={() => set({ imageUrl: '' })} className="text-rose-700 font-bold cursor-pointer">Remove picture</button>
              </>
            )}
          </div>
        )}
        <label className="flex items-center gap-2 font-bold text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} /> Show on the website
        </label>
        <p className="text-[11px] text-slate-500">Words that promise or guarantee returns are not accepted. The standard mutual fund risk warning is shown on every page.</p>
        <div className="flex gap-2">
          <button type="button" disabled={saving} onClick={save} className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
            <Save className="w-3.5 h-3.5" /> {editingId ? 'Save changes' : 'Add page'}
          </button>
          {(editingId || form.title) && (
            <button type="button" onClick={reset} className="px-4 py-2 rounded-xl border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer"><X className="w-3.5 h-3.5" /> Cancel</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <p className="font-bold text-slate-900 text-sm">All pages ({shown.length})</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold bg-white">
            <option value="">All menus</option>
            {menus.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        {shown.length === 0 && <p className="text-slate-500 py-4 text-center">No pages yet.</p>}
        <ul className="divide-y divide-slate-100">
          {shown.map((x) => (
            <li key={x.id} className="py-2.5 flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className={`font-bold ${x.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                  {x.title} {x.badge && <span className="ml-1 text-[10px] text-emerald-700">{x.badge}</span>}
                </p>
                <p className="text-[11px] text-slate-500">{menuName_(x.menuId)} / {x.section} / {x.kind === 'page' ? 'Page' : x.kind === 'link' ? 'Outside link' : x.kind === 'route' ? 'Site part' : 'Calculators'}</p>
              </div>
              <button type="button" aria-label="Move up" onClick={() => moveItem(x, -1)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label="Move down" onClick={() => moveItem(x, 1)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label={x.isActive ? 'Hide' : 'Show'} onClick={() => run(() => siteStorage.patchItem(x.id, { isActive: !x.isActive }))} className="p-1.5 rounded-md border border-slate-200 cursor-pointer">{x.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
              <button type="button" aria-label="Edit" onClick={() => startEdit(x)} className="p-1.5 rounded-md border border-slate-200 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" aria-label="Delete" onClick={() => setDelItem(x)} className="p-1.5 rounded-md border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmModal
        isOpen={!!delItem}
        title="Delete this page?"
        message={`"${delItem?.title ?? ''}" will be removed from the website.`}
        confirmLabel="Delete"
        onCancel={() => setDelItem(null)}
        onConfirm={() => {
          const t = delItem!;
          setDelItem(null);
          if (editingId === t.id) reset();
          run(() => siteStorage.deleteItem(t.id), 'Page deleted.');
        }}
      />
      <ConfirmModal
        isOpen={!!delMenu}
        title="Delete this menu?"
        message={`"${delMenu?.label ?? ''}" and all ${items.filter((x) => x.menuId === delMenu?.id).length} pages under it will be removed from the website.`}
        confirmLabel="Delete menu"
        onCancel={() => setDelMenu(null)}
        onConfirm={() => {
          const t = delMenu!;
          setDelMenu(null);
          run(() => siteStorage.deleteMenu(t.id, items.filter((x) => x.menuId === t.id).map((x) => x.id)), 'Menu deleted.');
        }}
      />
    </div>
  );
};

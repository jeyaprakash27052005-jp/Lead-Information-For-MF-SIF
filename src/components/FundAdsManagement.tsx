import React, { useEffect, useRef, useState } from 'react';
import { Landmark, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, Save, X, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { AdAnimation, AdAnimationSpeed, AdTextEffect, FundAd, User } from '../types';
import { fundAdsStorage } from '../services/fundAdsStorage';
import { prepareAdImage } from '../services/adsStorage';
import { AD_ANIMATIONS, AD_SPEEDS, AD_TEXT_EFFECTS } from '../utils/adAnimations';
import { FUND_CATEGORIES, MF_DISCLAIMER, RISK_LEVELS, findBannedClaim } from '../utils/fundAdRules';
import { FundAdCard } from './FundAdCard';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const empty = () => ({
  fundName: '',
  fundHouse: '',
  category: FUND_CATEGORIES[0] as string,
  headline: '',
  description: '',
  highlights: '',
  riskLevel: '' as FundAd['riskLevel'] | '',
  minSip: '',
  linkUrl: '',
  badge: '',
  imageUrl: '',
  animation: 'zoom-in' as AdAnimation,
  textEffect: 'rise' as AdTextEffect,
  animationSpeed: 'normal' as AdAnimationSpeed,
  isActive: true,
});

/** Mutual fund advertisements are added, edited and deleted here only (Head, Regional and Area Incharge) */
export const FundAdsManagement: React.FC<Props> = ({ currentUser, onNotify }) => {
  const allowed = currentUser.role === 'head' || currentUser.role === 'regional_incharge' || currentUser.role === 'area_incharge';
  const [ads, setAds] = useState<FundAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<FundAd | null>(null);
  const [replay, setReplay] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAds(await fundAdsStorage.getAds());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const set = (p: Partial<ReturnType<typeof empty>>) => setForm((f) => ({ ...f, ...p }));
  const reset = () => {
    setForm(empty());
    setEditingId(null);
    setError(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(jpe?g|png|gif)$/i.test(f.name) && !/^image\/(jpeg|png|gif)$/.test(f.type)) return setError('Please upload a JPG, PNG or GIF image.');
    try {
      set({ imageUrl: await prepareAdImage(f) });
      setFileName(f.name);
      setError(null);
      setReplay((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process this image.');
    }
  };

  const highlightsList = form.highlights.split('\n').map((x) => x.trim()).filter(Boolean);

  const validate = (): string | null => {
    if (form.fundName.trim().length < 3) return 'Enter the scheme name.';
    if (form.fundHouse.trim().length < 2) return 'Enter the fund house (AMC).';
    if (form.headline.trim().length < 5) return 'Write a headline (at least 5 characters).';
    if (!form.imageUrl) return 'Upload the advertisement image (JPG, PNG or GIF).';
    if (highlightsList.length > 5) return 'Use at most 5 highlight lines.';
    if (form.minSip && !(Number(form.minSip) >= 100)) return 'The minimum SIP must be a number, at least 100.';
    if (form.linkUrl.trim() && !/^https:\/\/\S+$/i.test(form.linkUrl.trim())) return 'The link must start with https://';
    const bad = findBannedClaim(form.fundName, form.headline, form.description, form.badge, ...highlightsList);
    if (bad) return `"${bad}" cannot be used in a mutual fund advertisement. Do not promise or guarantee returns.`;
    return null;
  };

  const buildData = () => ({
    fundName: form.fundName.trim(),
    fundHouse: form.fundHouse.trim(),
    category: form.category,
    headline: form.headline.trim(),
    description: form.description.trim(),
    highlights: highlightsList,
    riskLevel: form.riskLevel || undefined,
    minSip: form.minSip ? Number(form.minSip) : 0,
    linkUrl: form.linkUrl.trim(),
    badge: form.badge.trim(),
    imageUrl: form.imageUrl,
    animation: form.animation,
    textEffect: form.textEffect,
    animationSpeed: form.animationSpeed,
    isActive: form.isActive,
  });

  const save = async () => {
    const v = validate();
    if (v) return setError(v);
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await fundAdsStorage.updateAd(editingId, buildData() as Partial<FundAd>);
        onNotify?.('Mutual fund advertisement updated.', 'success');
      } else {
        await fundAdsStorage.createAd({ ...buildData(), order: ads.length + 1 } as Omit<FundAd, 'id' | 'createdAt'>, currentUser.name);
        onNotify?.('Mutual fund advertisement added. Customers can see it now.', 'success');
      }
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the advertisement.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (a: FundAd) => {
    setEditingId(a.id);
    setError(null);
    setFileName(null);
    setForm({
      fundName: a.fundName,
      fundHouse: a.fundHouse,
      category: a.category,
      headline: a.headline,
      description: a.description || '',
      highlights: (a.highlights || []).join('\n'),
      riskLevel: a.riskLevel || '',
      minSip: a.minSip ? String(a.minSip) : '',
      linkUrl: a.linkUrl || '',
      badge: a.badge || '',
      imageUrl: a.imageUrl,
      animation: a.animation || 'none',
      textEffect: a.textEffect || 'rise',
      animationSpeed: a.animationSpeed || 'normal',
      isActive: a.isActive,
    });
    setReplay((n) => n + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = async (a: FundAd) => {
    try {
      await fundAdsStorage.updateAd(a.id, { isActive: !a.isActive });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the advertisement.');
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const t = toDelete;
    setToDelete(null);
    try {
      await fundAdsStorage.deleteAd(t.id);
      if (editingId === t.id) reset();
      onNotify?.('Advertisement deleted.', 'info');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the advertisement.');
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= ads.length) return;
    const next = [...ads];
    [next[i], next[j]] = [next[j], next[i]];
    setAds(next);
    await fundAdsStorage.reorder(next);
  };

  if (!allowed) {
    return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">Only the admin team can manage mutual fund advertisements.</div>;
  }

  const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg';
  const lbl = 'block text-xs font-bold text-slate-700 uppercase tracking-wider';
  const preview: FundAd = {
    id: 'preview',
    fundName: form.fundName || 'Scheme name',
    fundHouse: form.fundHouse || 'Fund house',
    category: form.category,
    headline: form.headline || 'Your headline',
    description: form.description,
    highlights: highlightsList,
    riskLevel: form.riskLevel || undefined,
    minSip: form.minSip ? Number(form.minSip) : undefined,
    linkUrl: form.linkUrl,
    badge: form.badge,
    imageUrl: form.imageUrl,
    animation: form.animation,
    textEffect: form.textEffect,
    animationSpeed: form.animationSpeed,
    isActive: true,
    order: 0,
    createdAt: '',
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" /> Mutual Fund Ads
          </div>
          <h2 className="text-lg font-black text-slate-900">Advertise mutual fund schemes to customers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only the admin team can add these. They appear for customers under <b>Mutual Fund Offers</b> and on the Home Screen. Every advertisement shows the standard risk warning automatically.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
        <p className="font-bold text-slate-900 text-sm">{editingId ? 'Edit advertisement' : 'New advertisement'}</p>
        {error && (
          <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={lbl}>
            Scheme name *
            <input value={form.fundName} onChange={(e) => set({ fundName: e.target.value })} maxLength={160} placeholder="e.g. SBI Small Cap Fund - Direct - Growth" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Fund house (AMC) *
            <input value={form.fundHouse} onChange={(e) => set({ fundHouse: e.target.value })} maxLength={80} placeholder="e.g. SBI Mutual Fund" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Category
            <select value={form.category} onChange={(e) => set({ category: e.target.value })} className={`mt-1 ${input} bg-white`}>
              {FUND_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Riskometer level (as printed by the fund)
            <select value={form.riskLevel || ''} onChange={(e) => set({ riskLevel: e.target.value as FundAd['riskLevel'] })} className={`mt-1 ${input} bg-white`}>
              <option value="">Not stated</option>
              {RISK_LEVELS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <label className={lbl}>
          Headline *
          <input value={form.headline} onChange={(e) => set({ headline: e.target.value })} maxLength={120} placeholder="e.g. Start a SIP in a small cap fund for the long term" className={`mt-1 ${input}`} />
        </label>
        <label className={lbl}>
          Details
          <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={800} className={`mt-1 ${input}`} />
        </label>
        <label className={lbl}>
          Highlights (one per line, up to 5)
          <textarea value={form.highlights} onChange={(e) => set({ highlights: e.target.value })} rows={3} placeholder={'Invests in small companies\nSuits 7 years or more'} className={`mt-1 ${input}`} />
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className={lbl}>
            Minimum SIP (₹, optional)
            <input value={form.minSip} inputMode="numeric" onChange={(e) => set({ minSip: e.target.value.replace(/[^0-9]/g, '') })} className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Badge (optional)
            <input value={form.badge} onChange={(e) => set({ badge: e.target.value })} maxLength={24} placeholder="New Fund Offer" className={`mt-1 ${input}`} />
          </label>
          <label className={lbl}>
            Fund house page (https)
            <input value={form.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} placeholder="https://..." className={`mt-1 ${input}`} />
          </label>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-glow px-3.5 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-800 font-bold flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {form.imageUrl ? 'Replace image' : 'Upload image *'}
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif" onChange={onFile} className="hidden" />
            <span className="text-[11px] text-slate-500">{fileName ? `Selected: ${fileName}` : 'JPG, PNG or GIF (large images are shrunk automatically)'}</span>
            <button type="button" onClick={() => setReplay((n) => n + 1)} className="ml-auto px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
              <Play className="w-3 h-3" /> Replay preview
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className={lbl}>
              Picture animation
              <select value={form.animation} onChange={(e) => { set({ animation: e.target.value as AdAnimation }); setReplay((n) => n + 1); }} className={`mt-1 ${input} bg-white`}>
                {AD_ANIMATIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className={lbl}>
              Speed
              <select value={form.animationSpeed} onChange={(e) => { set({ animationSpeed: e.target.value as AdAnimationSpeed }); setReplay((n) => n + 1); }} className={`mt-1 ${input} bg-white`}>
                {AD_SPEEDS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className={lbl}>
              Headline effect
              <select value={form.textEffect} onChange={(e) => { set({ textEffect: e.target.value as AdTextEffect }); setReplay((n) => n + 1); }} className={`mt-1 ${input} bg-white`}>
                {AD_TEXT_EFFECTS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>
          {form.imageUrl && (
            <div className="max-w-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Preview (how customers see it)</p>
              <FundAdCard ad={preview} playKey={replay} />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} /> Show this advertisement to customers
        </label>
        <p className="text-[11px] text-slate-500">
          Advertising rules: do not promise or guarantee returns. This warning is added to every advertisement automatically: <i>{MF_DISCLAIMER}</i>
        </p>
        <div className="flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={reset} className="btn-glow px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer">
              <X className="w-3.5 h-3.5" /> Cancel edit
            </button>
          )}
          <button type="button" onClick={save} disabled={saving} className="btn-glow px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer">
            {editingId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {saving ? 'Saving...' : editingId ? 'Save advertisement' : 'Publish advertisement'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <p className="p-4 border-b border-slate-200 text-sm font-bold text-slate-900">Advertisements ({ads.length})</p>
        {loading && <p className="p-6 text-center text-xs text-slate-400">Loading...</p>}
        {!loading && ads.length === 0 && <p className="p-8 text-center text-xs text-slate-500">No mutual fund advertisements yet. Use the form above to add the first one.</p>}
        <div className="divide-y divide-slate-100">
          {ads.map((a, i) => (
            <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <img src={a.imageUrl} alt="" className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{a.fundName}</p>
                  <p className="text-slate-500 truncate">{a.fundHouse} • {a.category}</p>
                  <p className="text-slate-400">
                    #{i + 1} • {a.isActive ? 'Shown to customers' : 'Hidden'}{a.createdBy ? ` • Added by ${a.createdBy}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} title="Move up" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" disabled={i === ads.length - 1} onClick={() => move(i, 1)} title="Move down" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => toggle(a)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-slate-700 bg-slate-50 border border-slate-200 flex items-center gap-1 cursor-pointer">
                  {a.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {a.isActive ? 'Hide' : 'Show'}
                </button>
                <button type="button" onClick={() => startEdit(a)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 flex items-center gap-1 cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button type="button" onClick={() => setToDelete(a)} className="btn-glow px-2.5 py-1.5 rounded-lg font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal isOpen={!!toDelete} title="Delete this advertisement?" message={`"${toDelete?.fundName}" will be removed for everyone.`} confirmLabel="Delete advertisement" onConfirm={remove} onCancel={() => setToDelete(null)} />
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { FundAd } from '../types';
import { fundAdsStorage } from '../services/fundAdsStorage';
import { useAppSettings } from '../context/AppSettings';
import { FundAdCard } from './FundAdCard';
import { FUND_CATEGORIES } from '../utils/fundAdRules';

/** The mutual fund advertisements the admin team added (read only, for customers and the Home Screen) */
export const FundAdsList: React.FC<{ limit?: number; compact?: boolean; hideWhenEmpty?: boolean }> = ({ limit, compact, hideWhenEmpty }) => {
  const { settings } = useAppSettings();
  const [ads, setAds] = useState<FundAd[] | null>(null);
  const [cat, setCat] = useState('ALL');

  useEffect(() => {
    let alive = true;
    const load = () => fundAdsStorage.getAds().then((l) => alive && setAds(l.filter((a) => a.isActive))).catch(() => alive && setAds((o) => o ?? []));
    load();
    const t = setInterval(load, 120000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const shown = useMemo(() => {
    const list = (ads || []).filter((a) => cat === 'ALL' || a.category === cat);
    return limit ? list.slice(0, limit) : list;
  }, [ads, cat, limit]);
  const cats = useMemo(() => FUND_CATEGORIES.filter((c) => (ads || []).some((a) => a.category === c)), [ads]);

  if (!settings.features.fundAds) return null;
  if (ads === null) return <p className="text-xs font-semibold text-slate-400 py-6 text-center">Loading...</p>;
  if (hideWhenEmpty && ads.length === 0) return null;

  return (
    <div className="space-y-4">
      {!limit && cats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {['ALL', ...cats].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${cat === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
            >
              {c === 'ALL' ? 'All funds' : c}
            </button>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
          <Landmark className="w-6 h-6 mx-auto text-slate-300 mb-2" />
          No mutual fund offers right now. Please check back soon.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <FundAdCard key={a.id} ad={a} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
};

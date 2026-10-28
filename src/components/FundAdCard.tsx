import React from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { FundAd } from '../types';
import { AnimatedAd } from './AnimatedAd';
import { adTextClass } from '../utils/adAnimations';
import { formatInr } from '../utils/currency';

/** One mutual fund advertisement */
export const FundAdCard: React.FC<{ ad: FundAd; playKey?: string | number; compact?: boolean }> = ({ ad, playKey, compact }) => (
  <article className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col lift-card">
    <div className="relative h-44 bg-slate-900">
      <AnimatedAd ad={{ imageUrl: ad.imageUrl, title: ad.fundName, animation: ad.animation, animationSpeed: ad.animationSpeed }} playKey={playKey} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
      {ad.badge && <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wide">{ad.badge}</span>}
      <div className={`absolute bottom-3 left-4 right-4 ${adTextClass(ad)}`}>
        <p className="text-base font-black text-white drop-shadow line-clamp-2">{ad.headline || ad.fundName}</p>
      </div>
    </div>
    <div className="p-4 space-y-2.5 flex-1 flex flex-col">
      <div>
        <p className="text-sm font-black text-slate-900">{ad.fundName}</p>
        <p className="text-[11px] font-semibold text-slate-500">
          {ad.fundHouse} • {ad.category}
        </p>
      </div>
      {!compact && ad.description && <p className="text-xs text-slate-600 whitespace-pre-line">{ad.description}</p>}
      {!compact && ad.highlights && ad.highlights.length > 0 && (
        <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
          {ad.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
        {ad.riskLevel && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Riskometer: {ad.riskLevel}</span>}
        {ad.minSip ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">SIP from {formatInr(ad.minSip)}</span> : null}
      </div>
      {ad.linkUrl && /^https:\/\//i.test(ad.linkUrl) && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glow inline-flex items-center gap-1.5 self-start px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
        >
          Know more <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  </article>
);

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { FundAd } from '../types';
import { fundAdsStorage } from '../services/fundAdsStorage';
import { formatInr } from '../utils/currency';

/** "Know more about the scheme" page: the fund's picture, details, highlights and the fund house link, in the same layout as an event page */
export const FundDetail: React.FC<{ adId: string; onHome: () => void; onAll: () => void }> = ({ adId, onHome, onAll }) => {
  const [ad, setAd] = useState<FundAd | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fundAdsStorage
      .getAds()
      .then((l) => alive && setAd(l.find((a) => a.id === adId && a.isActive) || null))
      .catch(() => alive && setAd(null));
    return () => {
      alive = false;
    };
  }, [adId]);

  const font = { fontFamily: "'Times New Roman', Times, serif" } as React.CSSProperties;
  if (ad === undefined) return <p className="text-base text-slate-400 text-center py-8">Loading...</p>;
  if (!ad)
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3" style={font}>
        <p className="text-base text-slate-700">This scheme was not found.</p>
        <button onClick={onAll} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-base font-bold cursor-pointer">See all mutual funds</button>
      </div>
    );

  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 font-bold text-slate-900 align-top whitespace-nowrap">{k}</td>
      <td className="py-2 text-slate-800">{children}</td>
    </tr>
  );

  return (
    <section className="max-w-5xl mx-auto space-y-4 text-base" style={font}>
      <button type="button" onClick={onHome} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold cursor-pointer hover:bg-slate-50">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      {ad.imageUrl && (
        <div className="relative max-w-md mx-auto h-36 sm:h-44 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          <img src={ad.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60" />
          <img src={ad.imageUrl} alt={ad.fundName} className="relative w-full h-full object-contain anim-rise" />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{ad.fundName}</h1>
          <p className="text-slate-600 font-semibold">{ad.fundHouse} • {ad.category}</p>
        </div>
        {ad.headline && <p className="text-lg font-bold text-indigo-800">{ad.headline}</p>}
        {ad.description && <p className="text-slate-800 whitespace-pre-line">{ad.description}</p>}
        <table className="w-full text-left">
          <tbody>
            <Row k="Fund house">{ad.fundHouse}</Row>
            <Row k="Category">{ad.category}</Row>
            {ad.riskLevel && <Row k="Riskometer">{ad.riskLevel}</Row>}
            {ad.minSip ? <Row k="SIP from">{formatInr(ad.minSip)} a month</Row> : null}
          </tbody>
        </table>
        {ad.highlights && ad.highlights.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">Highlights:</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-800">{ad.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {ad.linkUrl && /^https:\/\//i.test(ad.linkUrl) && (
            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">
              Fund house page <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button type="button" onClick={onAll} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 cursor-pointer hover:bg-slate-50">See all mutual funds</button>
        </div>
        <p className="text-sm text-slate-500">Mutual fund investments are subject to market risks. Read all scheme related documents carefully.</p>
      </div>
    </section>
  );
};

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

  const [active, setActive] = useState('home');
  const extra = (ad?.sections || []).filter((x) => x.title.trim());
  const nav = [
    { id: 'home', title: 'Home' },
    { id: 'highlights', title: 'Highlights' },
    { id: 'details', title: 'Scheme Details' },
    ...extra.map((x) => ({ id: `x_${x.id}`, title: x.title })),
    { id: 'calc', title: 'Calculators' },
    { id: 'link', title: 'Fund House Page' },
    { id: 'enquiry', title: 'Scheme Enquiry' },
  ];
  const custom = extra.find((x) => `x_${x.id}` === active);
  const font = { fontFamily: "'Times New Roman', Times, serif" } as React.CSSProperties;
  if (ad === undefined) return <p className="text-lg text-slate-400 text-center py-8">Loading...</p>;
  if (!ad)
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3" style={font}>
        <p className="text-lg text-slate-700">This scheme was not found.</p>
        <button onClick={onAll} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-lg font-bold cursor-pointer">See all mutual funds</button>
      </div>
    );

  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 font-bold text-slate-900 align-top whitespace-nowrap">{k}</td>
      <td className="py-2 text-slate-800">{children}</td>
    </tr>
  );

  return (
    <section className="w-full space-y-4 text-lg" style={font}>
      <button type="button" onClick={onHome} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold cursor-pointer hover:bg-slate-50">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
      {ad.imageUrl && (
        <div className="relative w-full aspect-[16/9] max-h-[70vh] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          <img src={ad.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-90" />
          <img src={ad.imageUrl} alt={ad.fundName} className="relative w-full h-full object-contain anim-rise" />
        </div>
      )}
      <div className="grid md:grid-cols-[14rem_1fr] lg:grid-cols-[17rem_1fr] gap-4 items-start">
        <aside className="bg-white rounded-2xl border border-slate-200 p-2 flex md:flex-col gap-1 overflow-x-auto md:sticky md:top-20" aria-label="Scheme pages">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActive(n.id)}
              className={`text-left whitespace-nowrap px-4 py-2.5 rounded-lg text-lg font-semibold cursor-pointer ${active === n.id ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'text-slate-800 hover:bg-slate-50'}`}
            >
              {n.title}
            </button>
          ))}
        </aside>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-5 min-w-0">
          {active === 'home' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">About the scheme:</h2>
              <p className="text-xl font-bold text-slate-900">{ad.fundName}</p>
              {ad.headline && <p className="font-bold text-indigo-800">{ad.headline}</p>}
              {ad.description ? <p className="text-slate-800 whitespace-pre-line">{ad.description}</p> : <p className="font-bold text-amber-700">Will be updated soon</p>}
            </>
          )}
          {active === 'highlights' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">Key highlights:</h2>
              {ad.highlights && ad.highlights.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-slate-800">{ad.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              ) : (
                <p className="font-bold text-amber-700">Will be updated soon</p>
              )}
            </>
          )}
          {active === 'details' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">Scheme details:</h2>
              <table className="w-full text-left">
                <tbody>
                  <Row k="Fund house">{ad.fundHouse}</Row>
                  <Row k="Category">{ad.category}</Row>
                  {ad.riskLevel && <Row k="Riskometer">{ad.riskLevel}</Row>}
                  {ad.minSip ? <Row k="SIP from">{formatInr(ad.minSip)} a month</Row> : null}
                  {ad.minLumpsum ? <Row k="Minimum lumpsum">{formatInr(ad.minLumpsum)}</Row> : null}
                  {ad.fundManager && <Row k="Fund manager">{ad.fundManager}</Row>}
                  {ad.benchmark && <Row k="Benchmark">{ad.benchmark}</Row>}
                  {ad.expenseRatio && <Row k="Expense ratio">{ad.expenseRatio}</Row>}
                  {ad.exitLoad && <Row k="Exit load">{ad.exitLoad}</Row>}
                  {ad.lockIn && <Row k="Lock-in">{ad.lockIn}</Row>}
                </tbody>
              </table>
            </>
          )}
          {custom && (
            <>
              <h2 className="text-2xl font-black text-slate-900">{custom.title}:</h2>
              {custom.body && (custom.body.split(/\n{2,}/).map((para, i) => <p key={i} className="text-slate-800 whitespace-pre-line">{para}</p>))}
              <div className="flex flex-wrap gap-3">
                {custom.fileUrl && /brochure/i.test(custom.title) && (
                  <a href={custom.fileUrl} download={custom.fileName || `${custom.title}`} className="btn-glow px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">Download {custom.fileName || 'file'}</a>
                )}
                {custom.linkUrl && /^https:\/\//i.test(custom.linkUrl) && (
                  <a href={custom.linkUrl} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">Open link <ExternalLink className="w-4 h-4" /></a>
                )}
              </div>
              {!custom.body && !(custom.fileUrl && /brochure/i.test(custom.title)) && !custom.linkUrl && <p className="font-bold text-amber-700">Will be updated soon</p>}
            </>
          )}
          {active === 'calc' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">Calculators:</h2>
              <p className="text-slate-800">Work out what a monthly SIP or a one-time investment can grow to.</p>
              <div className="flex flex-wrap gap-3">
                <a href="#/calc/sip" className="btn-glow px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">SIP calculator</a>
                <a href="#/calc/lumpsum" className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 hover:bg-slate-50">Lumpsum calculator</a>
              </div>
            </>
          )}
          {active === 'link' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">Fund house page:</h2>
              {ad.linkUrl && /^https:\/\//i.test(ad.linkUrl) ? (
                <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">
                  Open {ad.fundHouse} <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <p className="font-bold text-amber-700">Will be updated soon</p>
              )}
            </>
          )}
          {active === 'enquiry' && (
            <>
              <h2 className="text-2xl font-black text-slate-900">Scheme enquiry:</h2>
              <p className="text-slate-800">Want to invest in {ad.fundName} or know more? Talk to our team.</p>
              <a href="#/contact" className="btn-glow inline-block px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">Contact us</a>
            </>
          )}
          <p className="text-base text-slate-500 pt-2 border-t border-slate-100">Mutual fund investments are subject to market risks. Read all scheme related documents carefully.</p>
          <button type="button" onClick={onAll} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 cursor-pointer hover:bg-slate-50">See all mutual funds</button>
        </div>
      </div>
    </section>
  );
};

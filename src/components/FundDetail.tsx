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
  const nav = [
    { id: 'home', title: 'Home' },
    { id: 'highlights', title: 'Highlights' },
    { id: 'details', title: 'Scheme Details' },
    { id: 'calc', title: 'Calculators' },
    { id: 'link', title: 'Fund House Page' },
    { id: 'enquiry', title: 'Scheme Enquiry' },
  ];
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
        <div className="relative w-full aspect-video max-h-[34rem] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          <img src={ad.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-90" />
          <img src={ad.imageUrl} alt={ad.fundName} className="relative w-full h-full object-contain anim-rise" />
        </div>
      )}
      <div className="grid md:grid-cols-[14rem_1fr] gap-4 items-start">
        <aside className="bg-white rounded-2xl border border-slate-200 p-2 flex md:flex-col gap-1 overflow-x-auto md:sticky md:top-20" aria-label="Scheme pages">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActive(n.id)}
              className={`text-left whitespace-nowrap px-4 py-2.5 rounded-lg text-base font-semibold cursor-pointer ${active === n.id ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'text-slate-800 hover:bg-slate-50'}`}
            >
              {n.title}
            </button>
          ))}
        </aside>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 space-y-5 min-w-0">
          {active === 'home' && (
            <>
              <h2 className="text-xl font-black text-slate-900">About the scheme:</h2>
              <p className="text-lg font-bold text-slate-900">{ad.fundName}</p>
              {ad.headline && <p className="font-bold text-indigo-800">{ad.headline}</p>}
              {ad.description ? <p className="text-slate-800 whitespace-pre-line">{ad.description}</p> : <p className="font-bold text-amber-700">Will be updated soon</p>}
            </>
          )}
          {active === 'highlights' && (
            <>
              <h2 className="text-xl font-black text-slate-900">Key highlights:</h2>
              {ad.highlights && ad.highlights.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-slate-800">{ad.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
              ) : (
                <p className="font-bold text-amber-700">Will be updated soon</p>
              )}
            </>
          )}
          {active === 'details' && (
            <>
              <h2 className="text-xl font-black text-slate-900">Scheme details:</h2>
              <table className="w-full text-left">
                <tbody>
                  <Row k="Fund house">{ad.fundHouse}</Row>
                  <Row k="Category">{ad.category}</Row>
                  {ad.riskLevel && <Row k="Riskometer">{ad.riskLevel}</Row>}
                  {ad.minSip ? <Row k="SIP from">{formatInr(ad.minSip)} a month</Row> : null}
                </tbody>
              </table>
            </>
          )}
          {active === 'calc' && (
            <>
              <h2 className="text-xl font-black text-slate-900">Calculators:</h2>
              <p className="text-slate-800">Work out what a monthly SIP or a one-time investment can grow to.</p>
              <div className="flex flex-wrap gap-3">
                <a href="#/calc/sip" className="btn-glow px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">SIP calculator</a>
                <a href="#/calc/lumpsum" className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 hover:bg-slate-50">Lumpsum calculator</a>
              </div>
            </>
          )}
          {active === 'link' && (
            <>
              <h2 className="text-xl font-black text-slate-900">Fund house page:</h2>
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
              <h2 className="text-xl font-black text-slate-900">Scheme enquiry:</h2>
              <p className="text-slate-800">Want to invest in {ad.fundName} or know more? Talk to our team.</p>
              <a href="#/contact" className="btn-glow inline-block px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold">Contact us</a>
            </>
          )}
          <p className="text-sm text-slate-500 pt-2 border-t border-slate-100">Mutual fund investments are subject to market risks. Read all scheme related documents carefully.</p>
          <button type="button" onClick={onAll} className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 cursor-pointer hover:bg-slate-50">See all mutual funds</button>
        </div>
      </div>
    </section>
  );
};

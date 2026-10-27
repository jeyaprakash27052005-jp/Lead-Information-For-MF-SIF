import React, { useEffect, useMemo, useState } from 'react';
import { UserCheck, ArrowLeft, ArrowRight, RotateCcw, Printer, RefreshCw, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Search } from 'lucide-react';
import {
  PROFILE_QUESTIONS,
  Answers,
  evaluateProfile,
  isProfileComplete,
  fundRiskLevel,
  fundFit,
  FUND_RISK_LABEL,
  minYearsFor,
} from '../utils/investorProfile';
import { DEFAULT_SCHEME_CODE, FundLatest, FundStats, fetchFundHistory, fetchFundLatest, fundStats } from '../services/mfApi';
import { formatInr } from '../utils/currency';

const pct = (x: number | null, d = 1) => (x === null || !Number.isFinite(x) ? 'n/a' : `${x >= 0 ? '' : ''}${x.toFixed(d)} %`);

const Stat: React.FC<{ label: string; value: string; tone?: 'good' | 'bad' }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`text-base font-black mt-0.5 ${tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const FIT_STYLE = {
  good: { box: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-800', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> },
  partial: { box: 'bg-amber-50 border-amber-300', text: 'text-amber-800', icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> },
  poor: { box: 'bg-rose-50 border-rose-300', text: 'text-rose-800', icon: <XCircle className="w-5 h-5 text-rose-600" /> },
} as const;

/**
 * Investor profile check: 11 questions give a risk profile; the fund's live data from api.mfapi.in decides how well the fund fits.
 * `mode="admin"` lets staff evaluate a customer sitting with them.
 */
export const InvestorProfile: React.FC<{ mode: 'customer' | 'admin'; defaultName?: string }> = ({ mode, defaultName }) => {
  const [code, setCode] = useState(DEFAULT_SCHEME_CODE);
  const [codeInput, setCodeInput] = useState(DEFAULT_SCHEME_CODE);
  const [fund, setFund] = useState<FundLatest | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundLoading, setFundLoading] = useState(true);
  const [stats, setStats] = useState<FundStats | null>(null);

  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0); // 0..10 questions, 11 = result
  const [who, setWho] = useState(defaultName || '');

  useEffect(() => {
    let alive = true;
    setFundLoading(true);
    setFundError(null);
    setStats(null);
    fetchFundLatest(code)
      .then((f) => {
        if (!alive) return;
        setFund(f);
        fetchFundHistory(code).then((pts) => alive && pts && setStats(fundStats(pts)));
      })
      .catch((e: Error) => alive && (setFund(null), setFundError(e.message)))
      .finally(() => alive && setFundLoading(false));
    return () => {
      alive = false;
    };
  }, [code]);

  const total = PROFILE_QUESTIONS.length;
  const done = step >= total;
  const q = PROFILE_QUESTIONS[Math.min(step, total - 1)];
  const result = useMemo(() => (isProfileComplete(answers) ? evaluateProfile(answers) : null), [answers]);
  const level = fund ? fundRiskLevel(fund.category, fund.type) : null;
  const fit = result && fund && level ? fundFit(result, answers, level, fund.name || 'This fund') : null;

  const restart = () => {
    setAnswers({});
    setStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <UserCheck className="w-4 h-4" /> Investor Profile
        </div>
        <h2 className="text-lg font-black text-slate-900">Find your risk profile and see how well a mutual fund fits you</h2>
        <p className="text-xs text-slate-500 mt-0.5">Answer {total} short questions. We then compare your profile with the live data of the fund below.</p>
      </div>

      {/* Live fund data from the API */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3" aria-live="polite">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fund being evaluated (live data)</p>
            {fundLoading && <p className="text-sm font-semibold text-slate-400 mt-1">Loading fund data...</p>}
            {fund && (
              <>
                <p className="text-sm font-black text-slate-900 mt-0.5">{fund.name}</p>
                <p className="text-xs text-slate-500">
                  {fund.fundHouse} • {fund.category}
                </p>
              </>
            )}
            {fundError && <p className="text-xs font-semibold text-rose-600 mt-1">{fundError}</p>}
          </div>
          {fund && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest NAV</p>
              <p className="text-lg font-black text-slate-900">{formatInr(fund.nav)}</p>
              <p className="text-[10px] text-slate-400">as on {fund.date}</p>
            </div>
          )}
        </div>
        {fund && level && (
          <p className="text-xs text-slate-600">
            Risk group of this type of fund: <b>{FUND_RISK_LABEL[level]}</b>. It usually needs{' '}
            {minYearsFor(level) > 0 ? `about ${minYearsFor(level)} years or more` : 'little time'} to work well.
          </p>
        )}
        <form
          className="flex flex-wrap items-center gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (codeInput.trim()) setCode(codeInput.trim());
          }}
        >
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="scheme-code">
            Scheme code
          </label>
          <input
            id="scheme-code"
            value={codeInput}
            inputMode="numeric"
            onChange={(e) => setCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-28 px-2.5 py-1.5 text-sm font-bold border border-slate-300 rounded-lg"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Search className="w-3.5 h-3.5" /> Load fund
          </button>
          {fundError && (
            <button type="button" onClick={() => setCode((c) => c + '')} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          )}
        </form>
      </div>

      {/* Questions */}
      {!done && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {mode === 'admin' && step === 0 && (
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Evaluating for (customer name, optional)
              <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={80} className="mt-1 w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg" />
            </label>
          )}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <span>
                Question {step + 1} of {total}
              </span>
              <span>{q.topic}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={step}>
              <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(step / total) * 100}%` }} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-base font-black text-slate-900 mb-2">{q.text}</legend>
            {q.options.map((opt) => {
              const on = answers[q.id] === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm font-semibold transition-colors ${
                    on ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <input type="radio" name={q.id} checked={on} onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))} className="accent-indigo-600" />
                  {opt.label}
                </label>
              );
            })}
          </fieldset>
          <div className="flex justify-between pt-1">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              disabled={!answers[q.id]}
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {step === total - 1 ? 'See my result' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {done && result && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-lg">
            {who.trim() && <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile of {who.trim()}</p>}
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Your investor profile</p>
            <p className="text-3xl font-black">{result.profile.label}</p>
            <p className="text-sm text-slate-200">{result.profile.summary}</p>
            <p className="text-xs text-slate-400">
              Score {result.score} out of {result.max}
              {result.rawProfile.key !== result.profile.key ? ` (the score alone says ${result.rawProfile.label}, lowered for safety)` : ''}
            </p>
            {result.limits.length > 0 && (
              <ul className="text-xs text-amber-200 space-y-1 list-disc pl-4">
                {result.limits.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <p className="text-sm font-black text-slate-900">Suggested mix of your investments</p>
            <div className="flex h-5 rounded-full overflow-hidden text-[10px] font-bold text-white" role="img" aria-label={`Equity ${result.profile.allocation.equity} percent, debt ${result.profile.allocation.debt} percent, gold ${result.profile.allocation.gold} percent`}>
              <div className="bg-indigo-600 flex items-center justify-center" style={{ width: `${result.profile.allocation.equity}%` }}>
                {result.profile.allocation.equity}%
              </div>
              <div className="bg-teal-600 flex items-center justify-center" style={{ width: `${result.profile.allocation.debt}%` }}>
                {result.profile.allocation.debt >= 8 ? `${result.profile.allocation.debt}%` : ''}
              </div>
              <div className="bg-amber-500 flex items-center justify-center" style={{ width: `${result.profile.allocation.gold}%` }}>
                {result.profile.allocation.gold}%
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm bg-indigo-600" /> Equity (shares, equity funds)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm bg-teal-600" /> Debt (debt funds, FD)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Gold
              </span>
            </div>
          </div>

          {fit && fund && (
            <div className={`rounded-2xl border p-5 space-y-3 ${FIT_STYLE[fit.kind].box}`}>
              <div className="flex items-start gap-2">
                {FIT_STYLE[fit.kind].icon}
                <div>
                  <p className={`text-sm font-black ${FIT_STYLE[fit.kind].text}`}>{fit.title}</p>
                  <p className="text-xs text-slate-700 font-semibold">{fund.name}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">{fit.share}</p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                {fit.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">How to invest</p>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  {fit.how.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {!fit && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 text-xs text-slate-600">
              The fund data could not be loaded, so the fund fit is not shown. Your profile above is still valid. Load a fund above and the fit appears here.
            </div>
          )}

          {stats && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> How this fund behaved in the past
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Stat label="Last 1 year" value={pct(stats.ret1y)} tone={stats.ret1y !== null && stats.ret1y < 0 ? 'bad' : 'good'} />
                <Stat label="3 years (per year)" value={pct(stats.cagr3y)} />
                <Stat label="5 years (per year)" value={pct(stats.cagr5y)} />
                <Stat label="Worst fall (3 years)" value={pct(stats.worstFall)} tone="bad" />
                <Stat label="Ups and downs a year" value={pct(stats.volatility)} />
              </div>
              <p className="text-[11px] text-slate-500">
                Past returns do not guarantee future returns. The worst fall shows the biggest drop from a high point in the last 3 years: ask yourself whether you would stay invested through a drop like that.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-[11px] text-slate-500 max-w-md">
              This is general guidance based only on your answers and public fund data. It is not personal investment advice. Mutual fund investments are subject to market risks; read all scheme documents and talk to a registered adviser before investing.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(total - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Change answers
              </button>
              <button type="button" onClick={restart} className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> Start again
              </button>
              <button type="button" onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

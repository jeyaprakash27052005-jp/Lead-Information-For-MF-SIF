import React, { useMemo, useState } from 'react';
import { TrendingUp, Shield, IndianRupee, Eye, Download, X } from 'lucide-react';
import { formatInr } from '../utils/currency';
import { NumField } from './NumField';
import { useAppSettings } from '../context/AppSettings';
import { FeatureOff } from './FeatureOff';
import {
  InvestMode,
  SipFrequency,
  DurationUnit,
  FREQUENCIES,
  DURATION_UNITS,
  ProjectionInput,
  computeProjection,
  validateProjection,
  describePeriod,
  periodsPerYear,
} from '../utils/projection';
import { generateProjectionPDF } from '../utils/projectionPdf';

export interface ProjectionCalculatorProps {
  kind: 'mutual_fund' | 'nps';
  customerName?: string;
  /** kept so older callers still compile; the calculator no longer uses a scheme list */
  schemes?: unknown;
  onApplyScheme?: unknown;
}

const THEMES = {
  mutual_fund: {
    banner: 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900',
    eyebrow: 'text-indigo-400',
    eyebrowText: 'Wealth Compounder Engine',
    title: 'Mutual Fund Return Calculator',
    subtitle: 'Find the future value of your mutual fund investment: one-time, SIP, or both.',
    Icon: TrendingUp,
    pillOn: 'bg-indigo-600 text-white border-indigo-600',
    hero: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700',
    heroLabel: 'text-emerald-100',
    link: 'text-indigo-600',
    apply: 'border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800',
    applyText: 'Express Interest in this Scheme',
  },
  nps: {
    banner: 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900',
    eyebrow: 'text-blue-400',
    eyebrowText: 'PFRDA Regulated Retirement Corpus',
    title: 'NPS Scheme Return Calculator',
    subtitle: 'Find the future value of your NPS investment: one-time, SIP, or both.',
    Icon: Shield,
    pillOn: 'bg-blue-600 text-white border-blue-600',
    hero: 'bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900',
    heroLabel: 'text-blue-200',
    link: 'text-blue-600',
    apply: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800',
    applyText: 'Express Interest in this NPS Scheme',
  },
} as const;

const Segmented = <T extends string>({
  value,
  options,
  onChange,
  onClass,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  onClass: string;
  label: string;
}) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
            on ? onClass : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export const ProjectionCalculator: React.FC<ProjectionCalculatorProps> = ({ kind, customerName }) => {
  const theme = THEMES[kind];
  const { settings } = useAppSettings();
  const label = kind === 'nps' ? 'NPS investment' : 'Mutual fund investment';
  const [mode, setMode] = useState<InvestMode>('sip');
  const [lumpStr, setLumpStr] = useState('100000');
  const [sipStr, setSipStr] = useState('5000');
  const [frequency, setFrequency] = useState<SipFrequency>('monthly');
  const [durationStr, setDurationStr] = useState('10');
  const [unit, setUnit] = useState<DurationUnit>('years');
  const [showView, setShowView] = useState(false);

  // The expected return is fixed by the Head / Regional Incharge in the admin portal
  const rate = kind === 'nps' ? settings.npsReturnRate : settings.mfReturnRate;

  const num = (v: string) => (v.trim() === '' || v === '.' ? NaN : Number(v));
  const input: ProjectionInput = {
    mode,
    lumpsumAmount: num(lumpStr),
    sipAmount: num(sipStr),
    frequency,
    durationValue: num(durationStr),
    durationUnit: unit,
    annualRatePct: rate,
  };
  const errors = validateProjection(input);
  const isValid = Object.keys(errors).length === 0;

  const result = useMemo(
    () => (isValid ? computeProjection(input) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isValid, mode, lumpStr, sipStr, frequency, durationStr, unit, rate]
  );

  const usesLump = mode === 'lumpsum' || mode === 'both';
  const usesSip = mode === 'sip' || mode === 'both';
  const gainPct = result && result.invested > 0 ? Math.min(100, Math.round((result.gain / result.maturity) * 100)) : 0;

  const downloadPdf = () =>
    result &&
    generateProjectionPDF({
      kind,
      schemeName: label,
      input,
      result,
      customerName,
    });

  const freqInfo = FREQUENCIES.find((f) => f.value === frequency)!;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className={`${theme.banner} text-white p-6 rounded-2xl shadow-xl border border-slate-800`}>
        <div className={`flex items-center gap-2 ${theme.eyebrow} font-bold text-xs uppercase tracking-wider mb-1`}>
          <theme.Icon className="w-4 h-4" />
          {theme.eyebrowText}
        </div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight">{theme.title}</h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xl">{theme.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <p className="text-[11px] text-slate-500 -mt-1">
            Expected return used for the calculation:{' '}
            <span className={`font-bold ${theme.link}`}>{rate}% per year</span> (fixed by the admin)
          </p>

          {/* How to invest */}
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">How do you want to invest?</p>
            <Segmented<InvestMode>
              label="Investment mode"
              value={mode}
              onChange={setMode}
              onClass={theme.pillOn}
              options={[
                { value: 'lumpsum', label: 'One-time (Lumpsum)' },
                { value: 'sip', label: 'SIP' },
                { value: 'both', label: 'Both' },
              ]}
            />
          </div>

          {usesLump && (
            <NumField
              label="One-time (lumpsum) amount (₹)"
              value={lumpStr}
              onChange={setLumpStr}
              error={errors.lumpsum}
              integer
              prefix={<IndianRupee className="w-4 h-4 text-slate-400" />}
            />
          )}

          {usesSip && (
            <div className="space-y-3">
              <NumField
                label={`SIP amount per ${freqInfo.noun} (₹)`}
                value={sipStr}
                onChange={setSipStr}
                error={errors.sip}
                integer
                prefix={<IndianRupee className="w-4 h-4 text-slate-400" />}
              />
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SIP interval</p>
                <Segmented<SipFrequency>
                  label="SIP interval"
                  value={frequency}
                  onChange={setFrequency}
                  onClass={theme.pillOn}
                  options={FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
                />
              </div>
            </div>
          )}

          {/* Period */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 items-start">
              <NumField
                label="Invest for"
                value={durationStr}
                onChange={setDurationStr}
                error={errors.duration}
                integer
              />
              <div>
                <p className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Period type</p>
                <Segmented<DurationUnit>
                  label="Period type"
                  value={unit}
                  onChange={setUnit}
                  onClass={theme.pillOn}
                  options={DURATION_UNITS.map((u) => ({ value: u.value, label: u.label }))}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              disabled={!isValid}
              onClick={() => setShowView(true)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>View Calculation</span>
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={downloadPdf}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </button>
          </div>

        </div>

        {/* Result */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Projected value for</span>
                <span className="font-bold text-slate-900 text-sm block truncate">{label}</span>
              </div>
              {isValid && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 whitespace-nowrap">
                  {describePeriod(input.durationValue, unit)}
                </span>
              )}
            </div>

            {!result ? (
              <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                Fill in the details on the left to see your future value.
              </p>
            ) : (
              <>
                <div className={`p-5 rounded-xl ${theme.hero} text-white shadow-lg`}>
                  <span className={`text-xs font-semibold ${theme.heroLabel} uppercase tracking-wider block`}>
                    Estimated future value
                  </span>
                  <div className="text-3xl font-black mt-1 tracking-tight">{formatInr(Math.round(result.maturity))}</div>
                  <p className={`text-[11px] ${theme.heroLabel} mt-1 font-medium`}>
                    At {rate}% expected return over {describePeriod(input.durationValue, unit)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total invested</span>
                    <div className="text-base font-bold text-slate-900 mt-1">{formatInr(Math.round(result.invested))}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Estimated gain</span>
                    <div className="text-base font-bold text-emerald-800 mt-1">{formatInr(Math.round(result.gain))}</div>
                  </div>
                </div>

                {mode === 'both' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-500 block">Lumpsum grows to</span>
                      <span className="font-bold text-slate-900">{formatInr(Math.round(result.lumpsumValue))}</span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-500 block">SIP grows to</span>
                      <span className="font-bold text-slate-900">{formatInr(Math.round(result.sipValue))}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
                    <div className="bg-slate-700" style={{ width: `${100 - gainPct}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${gainPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-1">
                    <span>Invested {100 - gainPct}%</span>
                    <span>Gain {gainPct}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View calculation */}
      {showView && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] font-bold ${theme.eyebrow} uppercase tracking-wider`}>{theme.title}</span>
                <h3 className="text-base font-bold mt-0.5">{label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowView(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  ['Mode', mode === 'both' ? 'Lumpsum + SIP' : mode === 'sip' ? 'SIP' : 'Lumpsum'],
                  ['Period', describePeriod(input.durationValue, unit)],
                  ['Expected return', `${rate}% p.a.`],
                  usesSip ? [`SIP (${freqInfo.label.toLowerCase()})`, formatInr(input.sipAmount)] : ['Lumpsum', formatInr(input.lumpsumAmount)],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{k}</span>
                    <span className="font-bold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Formula used</span>
                {usesLump && (
                  <>
                    <p className="font-mono text-[11px] font-bold text-slate-900">Lumpsum: M = P × (1 + R)^t</p>
                    <p className="text-[11px] text-slate-600">
                      P = {formatInr(input.lumpsumAmount)} • R = {rate / 100} ({rate}% p.a.) • t = {result.years.toFixed(4)} years
                    </p>
                  </>
                )}
                {usesSip && (
                  <>
                    <p className="font-mono text-[11px] font-bold text-slate-900">SIP: M = S × [ ((1 + i)^n − 1) / i ] × (1 + i)</p>
                    <p className="text-[11px] text-slate-600">
                      S = {formatInr(input.sipAmount)} • i = {rate} / {periodsPerYear(frequency)} / 100 ={' '}
                      {(rate / periodsPerYear(frequency) / 100).toFixed(6)} • n = {result.installments} installments
                    </p>
                  </>
                )}
              </div>

              <div className={`p-4 rounded-xl ${theme.hero} text-white`}>
                <span className={`text-[10px] font-bold ${theme.heroLabel} uppercase tracking-wider block`}>Estimated future value</span>
                <div className="text-2xl font-black">{formatInr(Math.round(result.maturity))}</div>
                <div className="flex gap-6 mt-1.5 text-[11px]">
                  <span>Invested {formatInr(Math.round(result.invested))}</span>
                  <span>Gain {formatInr(Math.round(result.gain))}</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Progress</th>
                      <th className="px-3 py-2">Invested</th>
                      <th className="px-3 py-2">Value</th>
                      <th className="px-3 py-2">Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.checkpoints.map((c) => (
                      <tr key={c.label}>
                        <td className="px-3 py-2 font-semibold text-slate-800">{c.label}</td>
                        <td className="px-3 py-2">{formatInr(Math.round(c.invested))}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{formatInr(Math.round(c.value))}</td>
                        <td className="px-3 py-2 text-emerald-700 font-semibold">{formatInr(Math.round(c.gain))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowView(false)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

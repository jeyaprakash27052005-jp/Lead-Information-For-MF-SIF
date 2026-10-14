import React, { useEffect, useMemo, useState } from 'react';
import { HeartPulse, ArrowLeft, ArrowRight, Download, RotateCcw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { apiService } from '../services/api';
import { DEFAULT_REGIONS, NATIONAL_HQ_REGION } from '../utils/regions';
import {
  HealthConfig,
  LIKERT,
  BAND_STYLE,
  BAND_SUMMARY,
  computeHealthScore,
  isComplete,
} from '../utils/healthCheck';
import { generateHealthReportPDF, blobToBase64 } from '../utils/healthReportPdf';
import { computeInvestmentPlan } from '../utils/healthInvestPlan';
import { formatInr } from '../utils/currency';
import { NumField } from './NumField';
import { useAppSettings } from '../context/AppSettings';
import { FeatureOff } from './FeatureOff';

interface HealthCheckupProps {
  source: 'health_portal' | 'customer_portal';
  defaultName?: string;
  defaultMobile?: string;
  defaultRegion?: string;
}

const API_BASE: string = (import.meta.env?.VITE_REPORT_API_URL as string | undefined) || '';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^[6-9][0-9]{9}$/;

type Gender = 'Male' | 'Female' | 'Other';

export const HealthCheckup: React.FC<HealthCheckupProps> = ({ source, defaultName, defaultMobile, defaultRegion }) => {
  const { settings, loaded: settingsLoaded } = useAppSettings();
  // undefined = still loading, null = the admin team has not added any questions yet
  const [config, setConfig] = useState<HealthConfig | null | undefined>(undefined);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [step, setStep] = useState(0); // 0 = about you, 1..N = question pages, N+1 = report
  const [name, setName] = useState(defaultName || '');
  const [ageStr, setAgeStr] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [occupation, setOccupation] = useState('');
  const [incomeStr, setIncomeStr] = useState('');
  const [region, setRegion] = useState(defaultRegion || NATIONAL_HQ_REGION);
  const [regions, setRegions] = useState<string[]>(DEFAULT_REGIONS);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showErrors, setShowErrors] = useState(false);

  const [reportId, setReportId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const [showDownload, setShowDownload] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState(defaultMobile && MOBILE_RE.test(defaultMobile) ? defaultMobile : '');
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [dlResult, setDlResult] = useState<{ leadSaved: boolean; leadError?: string; email: 'sent' | 'not_configured' | 'failed'; reason?: string } | null>(null);

  useEffect(() => {
    apiService
      .getHealthConfig()
      .then((c: HealthConfig | null) => setConfig(c))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    apiService
      .getRegions()
      .then((r: string[]) => r.length && setRegions(r))
      .catch(() => undefined);
  }, []);

  const cfg: HealthConfig = config || { categories: [], questions: [] };
  const cats = cfg.categories;
  const totalPages = cats.length;
  const reportStep = totalPages + 1;
  const age = Number(ageStr);
  const income = Number(incomeStr);

  const profileErrors: Record<string, string> = {};
  if (name.trim().length < 2) profileErrors.name = 'Enter your full name';
  if (!Number.isInteger(age) || age < 18 || age > 100) profileErrors.age = 'Enter your age (18 to 100)';
  if (!gender) profileErrors.gender = 'Select your gender';
  if (occupation.trim().length < 2) profileErrors.occupation = 'Enter your occupation';
  if (incomeStr.trim() === '' || !(income >= 0)) profileErrors.income = 'Enter your yearly income (0 if none)';
  const profileOk = Object.keys(profileErrors).length === 0;

  const pageQuestions = (page: number) => cfg.questions.filter((q) => q.category === cats[page - 1].id);
  const pageComplete = (page: number) => pageQuestions(page).every((q) => answers[q.id]);

  const plan = useMemo(
    () =>
      isComplete(answers, cfg)
        ? computeInvestmentPlan(
            { age, annualIncome: income, band: computeHealthScore(answers, cfg).band },
            { mfReturnRate: settings.mfReturnRate, npsReturnRate: settings.npsReturnRate }
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, config, age, income, settings.mfReturnRate, settings.npsReturnRate]
  );

  const score = useMemo(() => (isComplete(answers, cfg) ? computeHealthScore(answers, cfg) : null), [answers, config]);

  const next = async () => {
    setShowErrors(true);
    if (step === 0) {
      if (!profileOk) return;
    } else if (step <= totalPages) {
      if (!pageComplete(step)) return;
    }
    setShowErrors(false);
    if (step === totalPages && score) {
      // Open the report and store it so the admin team can see it
      setStep(reportStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await saveReport();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildReport = () => ({
    name: name.trim(),
    age,
    gender: gender as Gender,
    occupation: occupation.trim(),
    annualIncome: income,
    region,
    answers,
    overallScore: score!.overall,
    band: score!.band,
    categoryScores: Object.fromEntries(score!.categories.map((c) => [c.id, c.score])),
    moneyStyle: score!.moneyStyle,
    source,
    questionSnapshot: cfg.questions.map((q) => ({ id: q.id, category: q.category, text: q.text, reverse: !!q.reverse })),
    investmentPlan: plan || undefined,
    categorySnapshot: cfg.categories.map((c) => ({ id: c.id, label: c.label, intro: c.intro, low: c.low, mid: c.mid, high: c.high })),
  });

  const saveReport = async (): Promise<string | null> => {
    if (reportId) return reportId;
    if (!score) return null;
    setSaving(true);
    try {
      const saved = await apiService.saveHealthReport(buildReport());
      setReportId(saved.id);
      setSaveFailed(false);
      return saved.id;
    } catch (_e) {
      setSaveFailed(true);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setReportId(null);
    setSaveFailed(false);
    setDlResult(null);
    setShowDownload(false);
    setShowErrors(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pdfInput = () => ({
    name: name.trim(),
    age,
    gender: gender as string,
    occupation: occupation.trim(),
    annualIncome: income,
    region,
    score: score!,
    plan: plan || undefined,
  });

  /** Saves the report + contact details for the admin team and e-mails the PDF. Safe to run again (Try again). */
  const deliver = async (blob: Blob) => {
    let leadSaved = false;
    let leadError: string | undefined;
    let id: string | null = null;
    try {
      id = reportId || (await saveReport());
      if (!id) throw new Error('Your report could not be saved right now.');
      await apiService.attachHealthReportContact(id, { email: email.trim(), mobile: mobile.trim() });
      leadSaved = true;
    } catch (e) {
      leadError = e instanceof Error ? e.message : 'Could not save your details.';
    }

    let emailStatus: 'sent' | 'not_configured' | 'failed' = 'failed';
    let reason: string | undefined;
    try {
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          score: score!.overall,
          band: score!.band,
          pdfBase64: await blobToBase64(blob),
        }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.emailSent) {
        emailStatus = 'sent';
      } else if (!j) {
        reason = 'API_NOT_FOUND';
        emailStatus = 'not_configured';
      } else {
        reason = String(j.reason || j.error || `HTTP_${res.status}`);
        if (res.status === 404 || j.reason === 'EMAIL_NOT_CONFIGURED') emailStatus = 'not_configured';
      }
    } catch (_e) {
      reason = 'NETWORK';
    }

    // Record the outcome so the admin team can see it and re-send from the admin portal
    if (id) apiService.markHealthReportEmail(id, emailStatus, reason).catch(() => undefined);
    setDlResult({ leadSaved, leadError, email: emailStatus, reason });
  };

  const handleDownload = async () => {
    setDlError(null);
    if (!EMAIL_RE.test(email.trim())) return setDlError('Enter a valid Gmail / e-mail ID.');
    if (!MOBILE_RE.test(mobile.trim())) return setDlError('Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).');
    if (!score) return;
    setDownloading(true);
    try {
      const blob = generateHealthReportPDF(pdfInput(), 'blob') as Blob;
      setPdfBlob(blob);

      // give the PDF to the person right away
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-health-report-${name.trim().replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      await deliver(blob);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Could not create the report PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRetry = async () => {
    if (!pdfBlob) return;
    setDownloading(true);
    try {
      await deliver(pdfBlob);
    } finally {
      setDownloading(false);
    }
  };

  // ------------------------------------------------------------------ render
  const featureOn = source === 'health_portal' ? settings.features.healthPortal : settings.features.healthCheckup;
  if (!settingsLoaded || config === undefined) {
    return <p className="text-center text-xs font-semibold text-slate-500 py-16">Loading...</p>;
  }
  if (!featureOn) {
    return <FeatureOff title="Finance Health Check-up is switched off" />;
  }
  if (!config || config.questions.length === 0) {
    return (
      <FeatureOff
        title="The check-up is being prepared"
        message="The questions have not been published yet. Please check back soon."
      />
    );
  }

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 text-sm font-bold text-slate-900 border rounded-lg focus:outline-hidden focus:ring-2 ${
      err && showErrors ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-rose-500'
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider mb-1">
          <HeartPulse className="w-4 h-4" />
          Finance Health Check-up
        </div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight">How healthy are your finances?</h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xl">
          Answer a few simple questions about your money habits and get your Financial Health Score with clear next steps.
        </p>
      </div>

      {step <= totalPages && (
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>{step === 0 ? 'About you' : cats[step - 1].label}</span>
            <span>
              Step {step + 1} of {totalPages + 1}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${((step + 1) / (totalPages + 1)) * 100}%` }} />
          </div>
        </div>
      )}

      {/* About you */}
      {step === 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Tell us about yourself</h3>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Customer name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputCls(profileErrors.name)} />
            {showErrors && profileErrors.name && <p className="text-[11px] font-semibold text-rose-600 mt-1">{profileErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Age" value={ageStr} onChange={setAgeStr} integer error={showErrors ? profileErrors.age : undefined} />
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputCls(profileErrors.gender)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {showErrors && profileErrors.gender && <p className="text-[11px] font-semibold text-rose-600 mt-1">{profileErrors.gender}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Occupation</label>
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Teacher, Business, Student" className={inputCls(profileErrors.occupation)} />
            {showErrors && profileErrors.occupation && <p className="text-[11px] font-semibold text-rose-600 mt-1">{profileErrors.occupation}</p>}
          </div>
          <NumField
            label="Annual income (₹)"
            value={incomeStr}
            onChange={setIncomeStr}
            integer
            error={showErrors ? profileErrors.income : undefined}
            hint="Total income for one year, before tax"
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputCls()}>
              <option value={NATIONAL_HQ_REGION}>Not sure</option>
              {regions
                .filter((r) => r !== NATIONAL_HQ_REGION)
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Question pages */}
      {step >= 1 && step <= totalPages && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{cats[step - 1].label}</h3>
            <p className="text-xs text-slate-500">{cats[step - 1].intro}</p>
          </div>
          {pageQuestions(step).map((q, idx) => {
            const missing = showErrors && !answers[q.id];
            return (
              <fieldset key={q.id} className={`p-3 rounded-xl border ${missing ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}>
                <legend className="px-1 text-xs font-bold text-slate-800">
                  {idx + 1}. {q.text}
                </legend>
                <div role="radiogroup" aria-label={q.text} className="grid grid-cols-5 gap-1.5 mt-2">
                  {LIKERT.map((o) => {
                    const on = answers[q.id] === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                        className={`px-1 py-2 rounded-lg border text-[10px] sm:text-[11px] font-bold leading-tight transition-colors cursor-pointer ${
                          on ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {missing && <p className="text-[11px] font-semibold text-rose-600 mt-1.5">Please choose an answer</p>}
              </fieldset>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      {step <= totalPages && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setShowErrors(false);
              setStep(Math.max(0, step - 1));
            }}
            disabled={step === 0}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            type="button"
            onClick={next}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {step === totalPages ? 'View Report' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Report */}
      {step === reportStep && score && (
        <div className="space-y-5">
          <div className={`p-6 rounded-2xl border ${BAND_STYLE[score.band].bg} ${BAND_STYLE[score.band].border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-28 h-28 shrink-0 rounded-full bg-white border-4 border-white shadow-md flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${BAND_STYLE[score.band].text}`}>{score.overall}</span>
                <span className="text-[10px] font-bold text-slate-400">out of 100</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Your financial health</span>
                <h3 className={`text-2xl font-black ${BAND_STYLE[score.band].text}`}>{score.band}</h3>
                <p className="text-xs text-slate-700 mt-1">{BAND_SUMMARY[score.band]}</p>
                <p className="text-xs font-bold text-slate-800 mt-2">Money style: {score.moneyStyle}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your score by area</h4>
            {score.categories.map((c) => (
              <div key={c.id}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{c.label}</span>
                  <span>
                    {c.score} • {c.band}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full ${BAND_STYLE[c.band].bar}`} style={{ width: `${c.score}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{c.tip}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Strengths</h4>
              <p className="text-xs text-emerald-900">{score.strengths.length ? score.strengths.join(', ') : 'Keep building - every habit counts.'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Priority areas</h4>
              <p className="text-xs text-amber-900">{score.priorities.length ? score.priorities.join(', ') : 'No urgent areas. Keep reviewing regularly.'}</p>
            </div>
          </div>

          {plan && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-black text-slate-900">How much you can invest every month</h4>
              {plan.monthlyInvest === 0 ? (
                <p className="text-xs text-slate-600">{plan.note}</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Mutual funds (SIP)</span>
                      <span className="text-xl font-black text-indigo-900 block mt-0.5">{formatInr(plan.mfMonthly)} / month</span>
                      <span className="text-[11px] text-indigo-800 block mt-1">
                        About {formatInr(plan.mfValue)} after {plan.mfYears} years (at {plan.mfRate}% a year)
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">NPS (pension)</span>
                      <span className="text-xl font-black text-blue-900 block mt-0.5">{formatInr(plan.npsMonthly)} / month</span>
                      <span className="text-[11px] text-blue-800 block mt-1">
                        {plan.npsMonthly > 0
                          ? `About ${formatInr(plan.npsValue)} after ${plan.npsYears} years (at ${plan.npsRate}% a year)`
                          : 'Not suggested at this age or amount'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700">
                    Total <b>{formatInr(plan.monthlyInvest)}</b> a month = {plan.investPct}% of your monthly income of {formatInr(plan.monthlyIncome)}.
                  </p>
                  <p className="text-[11px] text-slate-500">{plan.note}</p>
                </>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Prepared for {name.trim()} • Age {age} • {gender} • {occupation.trim()} • Income {formatInr(income)}
          </p>

          {saveFailed && (
            <p className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Your report could not be saved to our system just now. You can still download it.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDlResult(null);
                setDlError(null);
                setShowDownload(true);
              }}
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
            <button
              type="button"
              onClick={restart}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Start again
            </button>
          </div>
        </div>
      )}

      {/* Download: ask for Gmail ID and mobile number */}
      {showDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Finance Health Check-up</span>
                <h3 className="text-base font-bold mt-0.5">Get your PDF report</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDownload(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!dlResult ? (
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">Enter your Gmail ID and mobile number. We will e-mail the report PDF to you.</p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gmail ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                {dlError && (
                  <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-600">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {dlError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  {downloading ? 'Preparing your report...' : 'Download & send report'}
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-3 text-xs">
                <p className="flex items-start gap-2 font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Your PDF report has been downloaded.
                </p>
                {dlResult.email === 'sent' && (
                  <p className="flex items-start gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> We e-mailed the report to {email.trim()}.
                  </p>
                )}
                {dlResult.email === 'not_configured' && (
                  <p className="text-amber-700 font-semibold">
                    The e-mail service is not set up yet, so the report was not e-mailed. Please keep the downloaded PDF.
                  </p>
                )}
                {dlResult.email === 'failed' && (
                  <p className="text-amber-700 font-semibold">We could not e-mail the report right now. Please keep the downloaded PDF.</p>
                )}
                {dlResult.email !== 'sent' && dlResult.reason && (
                  <p className="text-[11px] text-slate-400">Reason: {dlResult.reason}</p>
                )}
                {dlResult.leadSaved ? (
                  <p className="text-slate-600">Our team has your details and may contact you on {mobile}.</p>
                ) : (
                  <p className="text-amber-700 font-semibold">{dlResult.leadError || 'We could not save your contact details.'}</p>
                )}
                {(dlResult.email !== 'sent' || !dlResult.leadSaved) && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={downloading}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    {downloading ? 'Trying again...' : 'Try again (save & e-mail)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDownload(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

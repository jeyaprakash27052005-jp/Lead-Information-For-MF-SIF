import React, { useEffect, useState } from 'react';
import { ToggleRight, Save, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { AppSettings, AppFeatureFlags, User } from '../types';
import { apiService } from '../services/api';
import { SaveErrorNotice, SaveProblem, describeSaveError } from './SaveErrorNotice';
import { useAppSettings } from '../context/AppSettings';
import { FEATURE_LABELS, mergeSettings } from '../utils/appSettings';

interface FeatureControlsProps {
  currentUser: User;
  onNotify: (message: string, type?: 'success' | 'error') => void;
}

const API_BASE: string = (import.meta.env?.VITE_REPORT_API_URL as string | undefined) || '';

const REASON_TEXT: Record<string, string> = {
  EMAIL_NOT_CONFIGURED: 'The e-mail settings are missing on this site (BREVO_API_KEY and REPORT_FROM_EMAIL).',
  BREVO_KEY_INVALID: 'The Brevo API key is not accepted. Create a new key in Brevo and paste it again.',
  SENDER_NOT_VERIFIED: 'The sender e-mail address is not verified in Brevo. Add it under Senders and verify it.',
  BREVO_REJECTED: 'Brevo did not accept the message.',
  UNREACHABLE: 'The e-mail service could not be reached.',
  API_NOT_FOUND: 'The e-mail function was not found on this site. Deploy the project that contains the /api folder.',
};

const NEEDS_CUSTOMER_PORTAL: (keyof AppFeatureFlags)[] = ['customerRegistration', 'mfCalculator', 'npsCalculator', 'schemesCatalog', 'healthCheckup'];

/** Only Head Incharge and Regional Incharge can switch features on or off and set the calculator rates */
export const FeatureControls: React.FC<FeatureControlsProps> = ({ currentUser, onNotify }) => {
  const { settings, setSettings } = useAppSettings();
  const allowed = currentUser.role === 'head' || currentUser.role === 'regional_incharge';
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [mfStr, setMfStr] = useState(String(settings.mfReturnRate));
  const [npsStr, setNpsStr] = useState(String(settings.npsReturnRate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProblem, setSaveProblem] = useState<SaveProblem | null>(null);

  useEffect(() => {
    setDraft(settings);
    setMfStr(String(settings.mfReturnRate));
    setNpsStr(String(settings.npsReturnRate));
  }, [settings]);

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ ok: boolean; reason?: string; detail?: string; missing?: string[] } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  if (!allowed) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-sm font-semibold text-slate-600">
        Only Head Incharge and Regional Incharge can use Feature Controls.
      </div>
    );
  }

  const toggle = (key: keyof AppFeatureFlags) =>
    setDraft((d) => ({ ...d, features: { ...d.features, [key]: !d.features[key] } }));

  const dirty =
    JSON.stringify(draft.features) !== JSON.stringify(settings.features) ||
    (draft.reportDelivery || 'message') !== (settings.reportDelivery || 'message') ||
    Number(mfStr) !== settings.mfReturnRate ||
    Number(npsStr) !== settings.npsReturnRate;

  const save = async () => {
    setError(null);
    setSaveProblem(null);
    const mf = Number(mfStr);
    const nps = Number(npsStr);
    if (!(mf > 0 && mf <= 100) || !(nps > 0 && nps <= 100)) {
      setError('Enter return rates above 0 and up to 100.');
      return;
    }
    setSaving(true);
    try {
      const saved = await apiService.saveAppSettings(
        mergeSettings({ ...draft, mfReturnRate: mf, npsReturnRate: nps }),
        `${currentUser.name} (${currentUser.designation})`
      );
      setSettings(saved);
      onNotify('Feature settings saved. They apply to everyone straight away.', 'success');
    } catch (e) {
      setSaveProblem(describeSaveError(e, 'The feature settings'));
    } finally {
      setSaving(false);
    }
  };

  const [msgCheck, setMsgCheck] = useState<{ ok: boolean; text: string } | null>(null);
  const checkMessageSetup = async () => {
    setMsgCheck(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-report-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error('missing');
      const parts = [j.whatsapp && `WhatsApp ready${j.template ? ' (template set)' : ' (no template: only works for people who messaged your number in the last 24 hours)'}`, j.sms && 'SMS ready'].filter(Boolean);
      setMsgCheck(parts.length ? { ok: true, text: parts.join(' and ') + '.' } : { ok: false, text: 'Not set up yet: add the WhatsApp or SMS keys on this site and redeploy.' });
    } catch (_e) {
      setMsgCheck({ ok: false, text: 'The message function was not found on this site. Deploy the project that contains the /api folder.' });
    }
  };

  const runCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });
      const j = await res.json().catch(() => null);
      setCheckResult(j ? j : { ok: false, reason: 'API_NOT_FOUND' });
    } catch (_e) {
      setCheckResult({ ok: false, reason: 'UNREACHABLE' });
    } finally {
      setChecking(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', name: currentUser.name, email: testEmail.trim() }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.emailSent) setTestMsg({ ok: true, text: `Test e-mail sent to ${testEmail.trim()}. Check the inbox (and spam).` });
      else {
        const reason = String((j && (j.reason || j.error)) || 'API_NOT_FOUND');
        setTestMsg({ ok: false, text: REASON_TEXT[reason] || `Could not send (${reason}).` });
      }
    } catch (_e) {
      setTestMsg({ ok: false, text: REASON_TEXT.UNREACHABLE });
    } finally {
      setTesting(false);
    }
  };

  const groups: { title: string; keys: (keyof AppFeatureFlags)[] }[] = [
    { title: 'Portals', keys: ['customerPortal', 'healthPortal'] },
    { title: 'Customer features', keys: ['customerRegistration', 'mfCalculator', 'npsCalculator', 'schemesCatalog', 'healthCheckup'] },
    { title: 'Home Screen and information', keys: ['homeAds', 'awarenessPrograms'] },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ToggleRight className="w-4 h-4" />
            Feature Controls
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Switch features on or off</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only Head Incharge and Regional Incharge can change these. Changes apply to everyone straight away. You can also
            allow or block each customer separately with the Permissions button in User Management.
          </p>
          {settings.updatedAt && (
            <p className="text-[11px] text-slate-400 mt-1">
              Last changed by {settings.updatedBy || 'admin'} on {new Date(settings.updatedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Only one error is shown at a time */}
      {saveProblem ? (
        <SaveErrorNotice problem={saveProblem} />
      ) : (
        error && (
          <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )
      )}

      {groups.map((g) => (
        <div key={g.title} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {g.title}
          </div>
          <ul className="divide-y divide-slate-100">
            {g.keys.map((k) => {
              const meta = FEATURE_LABELS.find((f) => f.key === k)!;
              const on = draft.features[k];
              // These features live inside the customer site, so they cannot work while the Customer Portal is off
              const locked = NEEDS_CUSTOMER_PORTAL.includes(k) && !draft.features.customerPortal;
              return (
                <li key={k} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                    <p className="text-[11px] text-slate-500">{meta.help}</p>
                    {locked && <p className="text-[11px] font-semibold text-amber-700">Switch the Customer Portal on to use this.</p>}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={meta.label}
                    onClick={() => toggle(k)}
                    disabled={locked}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-0.5'}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Expected return used by the calculators</p>
          <p className="text-[11px] text-slate-500">
            Customers cannot change these. They are used by the calculators and by the investment suggestion in the health check-up report.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Mutual fund return (% per year)
            <input
              inputMode="decimal"
              value={mfStr}
              onChange={(e) => setMfStr(e.target.value.replace(/[^0-9.]/g, ''))}
              className="mt-1 w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            NPS return (% per year)
            <input
              inputMode="decimal"
              value={npsStr}
              onChange={(e) => setNpsStr(e.target.value.replace(/[^0-9.]/g, ''))}
              className="mt-1 w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <p className="text-sm font-bold text-slate-900">How the health check-up report reaches the customer</p>
        <p className="text-[11px] text-slate-500">The customer's e-mail ID and mobile number are collected and saved in both cases. Press Save changes to apply.</p>
        {([
          ['message', 'Message (WhatsApp / SMS)', 'The report PDF downloads and the customer can send it on WhatsApp or SMS from their phone. Nothing is e-mailed, so no e-mail API key is needed.'],
          ['email', 'E-mail the PDF', 'The PDF is e-mailed to the customer. Needs the Brevo API key (see below).'],
        ] as const).map(([v, label, help]) => (
          <label key={v} className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="radio" name="report-delivery" className="mt-0.5" checked={(draft.reportDelivery || 'message') === v} onChange={() => setDraft((d) => ({ ...d, reportDelivery: v }))} />
            <span><span className="font-bold text-slate-900">{label}</span><br /><span className="text-slate-500">{help}</span></span>
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={checkMessageSetup}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Check automatic WhatsApp / SMS setup
          </button>
          {msgCheck && <span className={`text-xs font-semibold ${msgCheck.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msgCheck.text}</span>}
        </div>
        <p className="text-[11px] text-slate-500">
          In Message mode the report is sent to the customer's phone automatically, as soon as they press Download report. WhatsApp needs WHATSAPP_TOKEN and
          WHATSAPP_PHONE_ID; SMS needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM (see the README). Until one is set up, the customer sees Send buttons instead.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-rose-600" />
          <p className="text-sm font-bold text-slate-900">Health check-up report e-mail</p>
        </div>
        <p className="text-[11px] text-slate-500">
          The report PDF is e-mailed to every customer who downloads it. This checks the e-mail settings of this site. Set the same
          settings (BREVO_API_KEY, REPORT_FROM_EMAIL) in the Health Check-up and Customer sites too.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
          >
            {checking ? 'Checking...' : 'Check e-mail setup'}
          </button>
          {checkResult && (
            <span className={`flex items-start gap-1.5 text-xs font-semibold ${checkResult.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
              {checkResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {checkResult.ok
                ? 'E-mail is set up and ready.'
                : `${REASON_TEXT[checkResult.reason || ''] || 'E-mail is not ready.'}${
                    checkResult.missing?.length ? ` Missing: ${checkResult.missing.join(', ')}.` : ''
                  }${checkResult.detail ? ` ${checkResult.detail}` : ''}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your e-mail for a test"
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg min-w-[220px]"
          />
          <button
            type="button"
            onClick={sendTest}
            disabled={testing || !testEmail.trim()}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {testing ? 'Sending...' : 'Send test e-mail'}
          </button>
        </div>
        {testMsg && <p className={`text-xs font-semibold ${testMsg.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{testMsg.text}</p>}
      </div>
    </div>
  );
};

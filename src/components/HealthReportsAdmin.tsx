import React, { useMemo, useState } from 'react';
import { HeartPulse, Download, Eye, Trash2, X, RefreshCw, MessageCircle, Mail, Phone, Send } from 'lucide-react';
import { HealthReport, User } from '../types';
import { SearchBox, SelectFilter, DateRangeFilter, ClearFilters, isoDay } from './FilterControls';
import { formatDateTime } from '../utils/dateTime';
import { formatInr } from '../utils/currency';
import {
  DEFAULT_HEALTH_CONFIG,
  HealthConfig,
  LIKERT,
  BAND_STYLE,
  HealthBand,
  computeHealthScore,
} from '../utils/healthCheck';
import { apiService } from '../services/api';
import { computeInvestmentPlan } from '../utils/healthInvestPlan';
import { useAppSettings } from '../context/AppSettings';
import { generateHealthReportPDF, blobToBase64 } from '../utils/healthReportPdf';
import { ConfirmModal } from './ConfirmModal';

const API_BASE: string = (import.meta.env?.VITE_REPORT_API_URL as string | undefined) || '';

/** The questions this person actually answered (falls back to the starter set for old reports) */
const configFor = (r: HealthReport): HealthConfig =>
  r.questionSnapshot && r.categorySnapshot && r.questionSnapshot.length
    ? { categories: r.categorySnapshot, questions: r.questionSnapshot }
    : DEFAULT_HEALTH_CONFIG;

interface HealthReportsAdminProps {
  reports: HealthReport[];
  currentUser: User;
  onRefresh: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SOURCE_LABEL: Record<HealthReport['source'], string> = {
  health_portal: 'Health Check-up Portal',
  customer_portal: 'Customer Portal',
};

const bandOf = (r: HealthReport) => (r.band as HealthBand) in BAND_STYLE ? (r.band as HealthBand) : 'Fair';

export const HealthReportsAdmin: React.FC<HealthReportsAdminProps> = ({ reports, currentUser, onRefresh, onDelete }) => {
  const { settings } = useAppSettings();
  const planFor = (r: HealthReport) =>
    r.investmentPlan ||
    computeInvestmentPlan(
      { age: r.age, annualIncome: r.annualIncome, band: r.band as HealthBand },
      { mfReturnRate: settings.mfReturnRate, npsReturnRate: settings.npsReturnRate }
    );
  const [search, setSearch] = useState('');
  const [bandFilter, setBandFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<HealthReport | null>(null);
  const [toDelete, setToDelete] = useState<HealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const canDelete = currentUser.role === 'head';
  const regions = useMemo(() => Array.from(new Set(reports.map((r) => r.region).filter(Boolean))).sort(), [reports]);

  const filtered = reports.filter((r) => {
    const q = search.trim().toLowerCase();
    return (
      (bandFilter === 'ALL' || r.band === bandFilter) &&
      (sourceFilter === 'ALL' || r.source === sourceFilter) &&
      (regionFilter === 'ALL' || r.region === regionFilter) &&
      (!dateFrom || isoDay(r.createdAt) >= dateFrom) &&
      (!dateTo || isoDay(r.createdAt) <= dateTo) &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        (r.mobile || '').includes(q) ||
        (r.email || '').toLowerCase().includes(q) ||
        r.occupation.toLowerCase().includes(q))
    );
  });
  const filtersOn = search || bandFilter !== 'ALL' || sourceFilter !== 'ALL' || regionFilter !== 'ALL' || dateFrom || dateTo;

  const downloadPdf = (r: HealthReport) =>
    generateHealthReportPDF(
      {
        name: r.name,
        age: r.age,
        gender: r.gender,
        occupation: r.occupation,
        annualIncome: r.annualIncome,
        region: r.region,
        createdAt: r.createdAt,
        score: computeHealthScore(r.answers, configFor(r)),
        plan: planFor(r),
      },
      'download'
    );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const detail = selected ? computeHealthScore(selected.answers, configFor(selected)) : null;
  const selectedCfg = selected ? configFor(selected) : DEFAULT_HEALTH_CONFIG;

  const [resending, setResending] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  /** Builds the report PDF again and e-mails it to the address the person gave */
  const resendEmail = async (r: HealthReport) => {
    if (!r.email || !r.mobile) return;
    setResending(r.id);
    setResendMsg(null);
    try {
      const blob = generateHealthReportPDF(
        {
          name: r.name,
          age: r.age,
          gender: r.gender,
          occupation: r.occupation,
          annualIncome: r.annualIncome,
          region: r.region,
          createdAt: r.createdAt,
          score: computeHealthScore(r.answers, configFor(r)),
          plan: planFor(r),
        },
        'blob'
      ) as Blob;
      const res = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: r.name,
          email: r.email,
          mobile: r.mobile,
          score: r.overallScore,
          band: r.band,
          pdfBase64: await blobToBase64(blob),
        }),
      });
      const j = await res.json().catch(() => null);
      if (res.ok && j && j.emailSent) {
        await apiService.markHealthReportEmail(r.id, 'sent');
        setResendMsg(`Report e-mailed to ${r.email}.`);
      } else {
        const reason = String((j && (j.reason || j.error)) || (j ? `HTTP_${res.status}` : 'API_NOT_FOUND'));
        await apiService.markHealthReportEmail(r.id, reason === 'EMAIL_NOT_CONFIGURED' || !j ? 'not_configured' : 'failed', reason);
        setResendMsg(`Could not e-mail the report (${reason}). Check the e-mail settings in Feature Controls.`);
      }
    } catch (_e) {
      setResendMsg('Could not reach the e-mail service. Please try again.');
    } finally {
      setResending(null);
      await onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
              <HeartPulse className="w-4 h-4" />
              Finance Health Check-up
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              Health Check-up Reports
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {filtered.length} of {reports.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Everyone who completed the check-up. Those who downloaded the report are also in the Leads Directory as
              “Finance Health Check-up Report Customer”.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={search} onChange={setSearch} placeholder="Search name, mobile, e-mail, occupation…" />
          <SelectFilter
            value={bandFilter}
            onChange={setBandFilter}
            allLabel="All Health Bands"
            options={(Object.keys(BAND_STYLE) as HealthBand[]).map((b) => ({ value: b, label: b }))}
          />
          <SelectFilter
            value={sourceFilter}
            onChange={setSourceFilter}
            allLabel="All Sources"
            options={[
              { value: 'health_portal', label: SOURCE_LABEL.health_portal },
              { value: 'customer_portal', label: SOURCE_LABEL.customer_portal },
            ]}
          />
          <SelectFilter
            value={regionFilter}
            onChange={setRegionFilter}
            allLabel="All Regions"
            options={regions.map((r) => ({ value: r, label: r }))}
          />
          <DateRangeFilter from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} />
          <ClearFilters
            show={!!filtersOn}
            onClick={() => {
              setSearch('');
              setBandFilter('ALL');
              setSourceFilter('ALL');
              setRegionFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {reports.length === 0 ? 'No health check-up reports yet.' : 'No reports match these filters.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Annual income</th>
                  <th className="px-4 py-3">Health score</th>
                  <th className="px-4 py-3">Source / Region</th>
                  <th className="px-4 py-3">Taken on</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const st = BAND_STYLE[bandOf(r)];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 align-top">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.age} yrs • {r.gender} • {r.occupation}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.mobile || r.email ? (
                          <div className="space-y-0.5">
                            {r.mobile && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {r.mobile}
                              </div>
                            )}
                            {r.email && (
                              <div className="flex items-center gap-1 break-all">
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                {r.email}
                              </div>
                            )}
                            {r.email && (
                              <div
                                className={`text-[11px] font-bold ${
                                  r.emailStatus === 'sent' ? 'text-emerald-700' : r.emailStatus ? 'text-rose-600' : 'text-slate-400'
                                }`}
                                title={r.emailError || ''}
                              >
                                {r.emailStatus === 'sent'
                                  ? 'E-mail sent'
                                  : r.emailStatus
                                  ? `E-mail not sent${r.emailError ? ` (${r.emailError})` : ''}`
                                  : 'E-mail not tried'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Viewed only — no download</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatInr(r.annualIncome)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border font-bold ${st.bg} ${st.text} ${st.border}`}>
                          {r.overallScore}/100 • {r.band}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">{r.moneyStyle}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{SOURCE_LABEL[r.source]}</div>
                        <div className="text-[11px] text-slate-500">{r.region}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View full report"
                            onClick={() => setSelected(r)}
                            className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Download PDF"
                            onClick={() => downloadPdf(r)}
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {r.email && r.mobile && (
                            <button
                              type="button"
                              title="Send the report PDF by e-mail again"
                              onClick={() => resendEmail(r)}
                              disabled={resending === r.id}
                              className="p-1.5 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {r.mobile && (
                            <a
                              title="Message on WhatsApp"
                              href={`https://wa.me/91${r.mobile}?text=${encodeURIComponent(
                                `Hello ${r.name}, this is regarding your Finance Health Check-up report (score ${r.overallScore}/100).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              title="Delete report"
                              onClick={() => setToDelete(r)}
                              className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resendMsg && (
        <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">{resendMsg}</div>
      )}

      {/* Full report */}
      {selected && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Finance Health Check-up</span>
                <h3 className="text-base font-bold mt-0.5">{selected.name}</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {selected.age} yrs • {selected.gender} • {selected.occupation} • {formatInr(selected.annualIncome)} a year •{' '}
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-2 rounded-xl border text-sm font-black ${BAND_STYLE[detail.band].bg} ${BAND_STYLE[detail.band].text} ${BAND_STYLE[detail.band].border}`}>
                  {detail.overall}/100 • {detail.band}
                </span>
                <span className="font-semibold text-slate-700">Money style: {detail.moneyStyle}</span>
                {selected.mobile && <span className="text-slate-600">Mobile: {selected.mobile}</span>}
                {selected.email && <span className="text-slate-600">E-mail: {selected.email}</span>}
              </div>

              <div className="space-y-2">
                {detail.categories.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span>{c.label}</span>
                      <span>{c.score}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${BAND_STYLE[c.band].bar}`} style={{ width: `${c.score}%` }} />
                    </div>
                    <p className="text-slate-500 mt-1">{c.tip}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Answers</h4>
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                  {selectedCfg.categories.map((cat) => (
                    <div key={cat.id} className="p-3 space-y-1.5">
                      <p className="font-bold text-slate-800">{cat.label}</p>
                      {selectedCfg.questions.filter((q) => q.category === cat.id).map((q) => (
                        <div key={q.id} className="flex justify-between gap-3 text-slate-600">
                          <span>{q.text}</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap">
                            {LIKERT.find((l) => l.value === selected.answers[q.id])?.label || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => downloadPdf(selected)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          isOpen
          title="Delete this report?"
          message={`The health check-up report of ${toDelete.name} will be removed. The lead in the Leads Directory is not affected.`}
          confirmLabel="Delete report"
          onConfirm={async () => {
            await onDelete(toDelete.id);
            setToDelete(null);
          }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

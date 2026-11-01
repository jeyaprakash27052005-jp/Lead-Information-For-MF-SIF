import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Copy, KeyRound, MessageSquare, Phone, RefreshCw, Search, Send, Trash2, UserCheck } from 'lucide-react';
import { SiteCustomer, SiteQuery, User } from '../types';
import { siteCustomerStorage } from '../services/siteCustomerStorage';
import { formatDateTime } from '../utils/dateTime';
import { formatIndianMobile } from '../utils/validation';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: User;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const roleName = (r?: string) => (r === 'head' ? 'Head Incharge' : r === 'regional_incharge' ? 'Regional Incharge' : r === 'area_incharge' ? 'Area Incharge' : 'Team');
const input = 'w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white';

/** Questions sent from the advertising website's Quick Response, and verification of the customers who created an account there */
export const CustomerQueries: React.FC<Props> = ({ currentUser, onNotify }) => {
  const canDelete = currentUser.role === 'head' || currentUser.role === 'regional_incharge';
  const [tab, setTab] = useState<'questions' | 'accounts'>('questions');
  const [queries, setQueries] = useState<SiteQuery[] | null>(null);
  const [customers, setCustomers] = useState<SiteCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'' | 'open' | 'answered'>('');
  const [acc, setAcc] = useState<'' | 'pending' | 'verified'>('');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [delQuery, setDelQuery] = useState<SiteQuery | null>(null);
  const [delCustomer, setDelCustomer] = useState<SiteCustomer | null>(null);

  const load = async () => {
    try {
      const [a, b] = await Promise.all([siteCustomerStorage.getQueries(), siteCustomerStorage.listCustomers()]);
      setQueries(a);
      setCustomers(b);
      setError(null);
    } catch (_e) {
      setQueries((o) => o ?? []);
      setError('Could not read the questions from the online database. Publish the latest firestore.rules (it adds "siteCustomers" and "siteQueries") and press Refresh.');
    }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const run = async (fn: () => Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn();
      if (ok) onNotify?.(ok, 'success');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const needle = q.trim().toLowerCase();
  const shownQ = useMemo(
    () => (queries ?? []).filter((x) => (!status || x.status === status) && (!needle || [x.customerName, x.mobile, x.email, x.topic, ...x.messages.map((m) => m.text)].some((t) => t.toLowerCase().includes(needle)))),
    [queries, status, needle]
  );
  const shownC = customers.filter((c) => (!acc || (acc === 'verified') === c.verified) && (!needle || [c.fullName, c.mobile, c.email].some((t) => t.toLowerCase().includes(needle))));
  const openCount = (queries ?? []).filter((x) => x.status === 'open').length;
  const pendingCount = customers.filter((c) => !c.verified).length;

  const sendReply = (x: SiteQuery) => {
    const text = (draft[x.id] || '').trim();
    if (text.length < 2) return setError('Type the reply first.');
    run(async () => {
      await siteCustomerStorage.addMessage(x, { from: 'staff', byName: currentUser.name, byRole: currentUser.role, text: text.slice(0, 2000), at: new Date().toISOString() });
      setDraft((d) => ({ ...d, [x.id]: '' }));
    }, 'Reply sent to the customer.');
  };

  const genCode = (c: SiteCustomer) =>
    run(async () => {
      const code = await siteCustomerStorage.generateCode(c.id);
      setCodes((m) => ({ ...m, [c.id]: code }));
    });

  const tabBtn = (id: 'questions' | 'accounts', label: string, n: number) => (
    <button type="button" onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer ${tab === id ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-600'}`}>
      {label} {n > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px]">{n}</span>}
    </button>
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" /> Customer Queries
          </div>
          <h2 className="text-lg font-black text-slate-900">Questions from the advertising website</h2>
          <p className="text-xs text-slate-500 mt-0.5">Customers send questions from <b>Quick Response</b>. Any Area, Regional or Head Incharge can reply; the answer shows to the customer on the website. New accounts are verified here.</p>
        </div>
        <button type="button" onClick={load} className="btn-glow px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      <div className="inline-flex gap-1 p-1 bg-slate-100 rounded-xl">
        {tabBtn('questions', 'Questions', openCount)}
        {tabBtn('accounts', 'Verify accounts', pendingCount)}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center gap-2 text-xs">
        <label className="relative flex-1 min-w-[12rem]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile, e-mail or text" className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded-lg font-semibold" />
        </label>
        {tab === 'questions' ? (
          <select value={status} onChange={(e) => setStatus(e.target.value as '' | 'open' | 'answered')} aria-label="Status" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
            <option value="">All questions</option>
            <option value="open">Waiting for reply</option>
            <option value="answered">Answered</option>
          </select>
        ) : (
          <select value={acc} onChange={(e) => setAcc(e.target.value as '' | 'pending' | 'verified')} aria-label="Account status" className="px-2 py-2 border border-slate-300 rounded-lg font-semibold bg-white">
            <option value="">All accounts</option>
            <option value="pending">Not verified yet</option>
            <option value="verified">Verified</option>
          </select>
        )}
      </div>

      {queries === null && <p className="text-xs text-slate-400 text-center py-6">Loading...</p>}

      {tab === 'questions' && (
        <div className="space-y-4">
          {queries !== null && shownQ.length === 0 && <p className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No questions here.</p>}
          {shownQ.map((x) => (
            <article key={x.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">{x.topic}</p>
                  <p className="text-slate-600 mt-0.5">
                    <b>{x.customerName}</b> · <a href={`tel:${x.mobile}`} className="text-indigo-700 font-semibold inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {formatIndianMobile(x.mobile)}</a> · {x.email}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${x.status === 'answered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>{x.status === 'answered' ? 'Answered' : 'Waiting for reply'}</span>
              </div>
              <ul className="space-y-2">
                {x.messages.map((m, i) => (
                  <li key={i} className={`rounded-xl px-3.5 py-2.5 ${m.from === 'staff' ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                    <p className="text-[11px] font-bold text-slate-500">{m.from === 'staff' ? `${m.byName} (${roleName(m.byRole)})` : x.customerName} · {formatDateTime(m.at)}</p>
                    <p className="text-slate-800 whitespace-pre-line mt-0.5 text-sm">{m.text}</p>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input value={draft[x.id] || ''} onChange={(e) => setDraft((d) => ({ ...d, [x.id]: e.target.value }))} maxLength={2000} placeholder="Write your reply to the customer" className={input} />
                <button type="button" onClick={() => sendReply(x)} className="px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  <Send className="w-3.5 h-3.5" /> Reply
                </button>
                {canDelete && (
                  <button type="button" aria-label="Delete question" onClick={() => setDelQuery(x)} className="p-2 rounded-lg border border-rose-200 text-rose-700 cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'accounts' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            No e-mail or SMS service is used. Call or message the customer on their mobile number, press <b>Generate code</b> and tell them the code. They type it on the website to verify. A code works for 48 hours; only a scrambled copy is stored. Use <b>Mark verified</b> if you have already confirmed the person.
          </p>
          {shownC.length === 0 && <p className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">No accounts here.</p>}
          {shownC.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    {c.fullName}
                    {c.verified ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Verified</span> : <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">Not verified</span>}
                  </p>
                  <p className="text-slate-600 mt-0.5"><a href={`tel:${c.mobile}`} className="text-indigo-700 font-semibold inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {formatIndianMobile(c.mobile)}</a> · {c.email} · created {formatDateTime(c.createdAt)}</p>
                  {c.codePending && !codes[c.id] && <p className="text-slate-500 mt-0.5">A code was given. It is valid until {formatDateTime(c.codeExpires)}.</p>}
                </div>
                {!c.verified && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => genCode(c)} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"><KeyRound className="w-3.5 h-3.5" /> Generate code</button>
                    <button type="button" onClick={() => run(() => siteCustomerStorage.markVerified(c.id), 'Account verified.')} className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer"><UserCheck className="w-3.5 h-3.5" /> Mark verified</button>
                  </div>
                )}
                {canDelete && <button type="button" aria-label="Delete account" onClick={() => setDelCustomer(c)} className="p-2 rounded-lg border border-rose-200 text-rose-700 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
              </div>
              {codes[c.id] && !c.verified && (
                <div className="flex flex-wrap items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-slate-700 font-semibold">Tell the customer this code (shown only now):</span>
                  <span className="font-mono text-lg font-black tracking-widest text-slate-900">{codes[c.id]}</span>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(codes[c.id]).catch(() => undefined)} className="px-2.5 py-1 rounded-md border border-slate-300 bg-white font-bold flex items-center gap-1 cursor-pointer"><Copy className="w-3 h-3" /> Copy</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!delQuery} title="Delete this question?" message={`The question from ${delQuery?.customerName ?? ''} and its replies will be removed.`} confirmLabel="Delete" onCancel={() => setDelQuery(null)} onConfirm={() => { const t = delQuery!; setDelQuery(null); run(() => siteCustomerStorage.deleteQuery(t.id), 'Question deleted.'); }} />
      <ConfirmModal isOpen={!!delCustomer} title="Delete this account?" message={`${delCustomer?.fullName ?? ''} will no longer be able to log in. Their questions stay.`} confirmLabel="Delete account" onCancel={() => setDelCustomer(null)} onConfirm={() => { const t = delCustomer!; setDelCustomer(null); run(() => siteCustomerStorage.deleteCustomer(t.id), 'Account deleted.'); }} />
    </div>
  );
};

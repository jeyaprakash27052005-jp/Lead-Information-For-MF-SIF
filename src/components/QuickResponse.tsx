import React, { useEffect, useState } from 'react';
import { AlertCircle, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { QueryMessage, SiteCustomer, SiteQuery } from '../types';
import { siteCustomerStorage } from '../services/siteCustomerStorage';
import { formatDateTime } from '../utils/dateTime';

const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const roleName = (r?: string) => (r === 'head' ? 'Head Incharge' : r === 'regional_incharge' ? 'Regional Incharge' : r === 'area_incharge' ? 'Area Incharge' : 'Our team');

/** Quick Response: a verified customer sends a question; the team's answer shows here */
export const QuickResponse: React.FC<{ customer: SiteCustomer }> = ({ customer }) => {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [list, setList] = useState<SiteQuery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [follow, setFollow] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setList(await siteCustomerStorage.getQueries(customer.id));
    } catch (_e) {
      setList((o) => o ?? []);
      setError('Could not load your questions. Please press Refresh.');
    }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [customer.id]);

  const send = async () => {
    if (text.trim().length < 5) return setError('Please type your question (at least 5 characters).');
    setBusy(true);
    setError(null);
    try {
      await siteCustomerStorage.createQuery(customer, topic.trim() || text.trim().slice(0, 60), text);
      setTopic('');
      setText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    } finally {
      setBusy(false);
    }
  };

  const reply = async (q: SiteQuery) => {
    const t = (follow[q.id] || '').trim();
    if (t.length < 2) return;
    const m: QueryMessage = { from: 'customer', byName: customer.fullName, text: t.slice(0, 2000), at: new Date().toISOString() };
    try {
      await siteCustomerStorage.addMessage(q, m);
      setFollow((f) => ({ ...f, [q.id]: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    }
  };

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Quick Response</h1>
        <p className="text-sm text-slate-600 mt-1">Ask your question. Our Area, Regional or Head Incharge will answer here.</p>
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <input value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} placeholder="Subject (optional)" className={input} />
        <textarea value={text} rows={4} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Type your question or query" className={input} />
        <button type="button" disabled={busy} onClick={send} className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
          <Send className="w-4 h-4" /> {busy ? 'Sending...' : 'Send'}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">Your questions</h2>
        <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      {list === null && <p className="text-xs text-slate-400">Loading...</p>}
      {list && list.length === 0 && <p className="text-sm text-slate-500">You have not asked anything yet.</p>}
      <div className="space-y-4">
        {(list ?? []).map((q) => (
          <article key={q.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-black text-slate-900 text-sm flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-blue-700" /> {q.topic}</p>
              <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${q.status === 'answered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                {q.status === 'answered' ? 'Answered' : 'Waiting for reply'}
              </span>
            </div>
            <ul className="space-y-2">
              {q.messages.map((m, i) => (
                <li key={i} className={`rounded-xl px-3.5 py-2.5 text-sm ${m.from === 'staff' ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <p className="text-[11px] font-bold text-slate-500">{m.from === 'staff' ? `${m.byName} (${roleName(m.byRole)})` : 'You'} · {formatDateTime(m.at)}</p>
                  <p className="text-slate-800 whitespace-pre-line mt-0.5">{m.text}</p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={follow[q.id] || ''} onChange={(e) => setFollow((f) => ({ ...f, [q.id]: e.target.value }))} maxLength={2000} placeholder="Write a follow-up" className={input} />
              <button type="button" onClick={() => reply(q)} className="px-4 rounded-xl border border-slate-300 text-sm font-bold cursor-pointer">Send</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

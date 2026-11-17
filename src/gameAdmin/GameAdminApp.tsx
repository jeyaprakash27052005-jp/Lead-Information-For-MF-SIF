import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Gamepad2, Settings, LogOut, RefreshCw, Download, FileSpreadsheet, Search, Trash2, ArrowUp, ArrowDown,
  Lock, Hash, AlertCircle, CheckCircle2, ExternalLink, Dices, Disc3, X,
} from 'lucide-react';
import mcubeLogo from '../assets/mcube-logo.png';
import { User } from '../types';
import { apiService } from '../services/api';
import { gameAdminStore, GamePlayer, HubSettings, cleanHub } from '../services/gameAdminStore';
import { GAME_LIST, gameName, deviceLabel, detailsText } from './games';
import { exportCsv, exportExcel } from './exportPlayers';
import { GameStaffPin } from '../components/GameStaffPin';
import { SaveErrorNotice, SaveProblem, describeSaveError } from '../components/SaveErrorNotice';

const SESSION = 'mcube_game_admin_user';
const GAMES_SITE: string = (import.meta.env?.VITE_GAMES_SITE_URL as string | undefined) || '';
type Tab = 'dashboard' | 'players' | 'games' | 'settings';

const inr = (n?: number) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '');
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const dayKey = (iso: string) => (iso || '').slice(0, 10);

/* ------------------------------------------------------------------ login */
const Login: React.FC<{ onIn: (u: User) => void }> = ({ onIn }) => {
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!username.trim() || !secret) return setErr(mode === 'pin' ? 'Enter your username and PIN.' : 'Enter your username and password.');
    setBusy(true);
    try {
      const { user } = mode === 'pin' ? await apiService.loginWithPin(username.trim(), secret) : await apiService.login(username.trim(), secret);
      if (user.role !== 'head') throw new Error('Only the Head Incharge can use the Game Admin.');
      onIn(user);
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <img src={mcubeLogo} alt="Mcube Academy" className="h-10 w-auto" />
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Mcube Game Admin</h1>
            <p className="text-xs text-slate-500">Players, results and settings of all games</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 text-xs font-bold" role="tablist">
          {(['password', 'pin'] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setSecret(''); setErr(''); }}
              className={`py-2 rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${mode === m ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              {m === 'password' ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
              {m === 'password' ? 'Password' : 'PIN'}
            </button>
          ))}
        </div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Head Incharge username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username"
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500" />
        </label>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {mode === 'pin' ? 'Login PIN' : 'Password'}
          <input type="password" value={secret} inputMode={mode === 'pin' ? 'numeric' : undefined} maxLength={mode === 'pin' ? 6 : undefined}
            onChange={(e) => setSecret(mode === 'pin' ? e.target.value.replace(/\D/g, '') : e.target.value)} autoComplete="current-password"
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono" />
        </label>
        {err && (
          <p className="flex items-start gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
          </p>
        )}
        <button disabled={busy} className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-[11px] text-slate-500">Same username, password and PIN as the main admin portal. Only the Head Incharge can sign in.</p>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ small pieces */
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-xs ${className || ''}`}>{children}</div>
);
const Kpi: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <Card className="p-4">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </Card>
);
const StatusPill: React.FC<{ s: string }> = ({ s }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${s === 'finished' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
    {s === 'finished' ? 'Finished' : 'Started'}
  </span>
);

/* ------------------------------------------------------------------ dashboard */
const Dashboard: React.FC<{ rows: GamePlayer[]; hub: HubSettings; go: (game: string) => void }> = ({ rows, hub, go }) => {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  const per = GAME_LIST.map((g) => {
    const list = rows.filter((p) => p.game === g.id);
    const scores = list.map((p) => p.score).filter((s): s is number => typeof s === 'number');
    return { g, n: list.length, fin: list.filter((p) => p.status === 'finished').length, top: scores.length ? Math.max(...scores) : undefined, last: list[0]?.registeredAt };
  });
  const max = Math.max(1, ...per.map((x) => x.n));
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10));
  const perDay = days.map((d) => rows.filter((p) => dayKey(p.registeredAt) === d).length);
  const dmax = Math.max(1, ...perDay);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Players" value={rows.length.toLocaleString('en-IN')} sub="all games" />
        <Kpi label="Finished games" value={rows.filter((p) => p.status === 'finished').length.toLocaleString('en-IN')} sub={rows.length ? `${Math.round((rows.filter((p) => p.status === 'finished').length / rows.length) * 100)}% of players` : ''} />
        <Kpi label="Today" value={rows.filter((p) => dayKey(p.registeredAt) === today).length} sub="new players" />
        <Kpi label="Last 7 days" value={rows.filter((p) => dayKey(p.registeredAt) >= weekAgo).length} sub="new players" />
      </div>
      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="p-5 lg:col-span-3">
          <p className="text-sm font-bold text-slate-900 mb-3">Players by game</p>
          <div className="space-y-2.5">
            {per.map(({ g, n, fin, top, last }) => (
              <button key={g.id} onClick={() => go(g.id)} className="w-full text-left group cursor-pointer">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center">{g.icon}</span>
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700 flex-1 truncate">{g.name}</span>
                  {hub.enabled[g.id] === false && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">OFF</span>}
                  <span className="font-bold text-slate-900 w-10 text-right">{n}</span>
                </div>
                <div className="ml-8 mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(n / max) * 100}%` }} />
                </div>
                <p className="ml-8 mt-0.5 text-[11px] text-slate-500">
                  {fin} finished{typeof top === 'number' ? ` · highest score ${inr(top)}` : ''}{last ? ` · last ${when(last)}` : ''}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm font-bold text-slate-900 mb-3">New players, last 14 days</p>
          <div className="flex items-end gap-1 h-40" role="img" aria-label="New players per day for the last 14 days">
            {perDay.map((n, i) => (
              <div key={days[i]} className="flex-1 flex flex-col items-center justify-end gap-1 h-full" title={`${days[i]}: ${n}`}>
                <span className="text-[10px] text-slate-500">{n || ''}</span>
                <div className="w-full rounded-t bg-indigo-500" style={{ height: `${(n / dmax) * 100}%`, minHeight: n ? 3 : 0 }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{new Date(days[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span>Today</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ players */
const Players: React.FC<{ rows: GamePlayer[]; head: User; game: string; setGame: (g: string) => void; reload: () => Promise<void>; notify: (m: string, ok?: boolean) => void }> = ({
  rows, head, game, setGame, reload, notify,
}) => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<SaveProblem | null>(null);
  const [page, setPage] = useState(0);
  const PAGE = 50;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (p) =>
        (!game || p.game === game) &&
        (!status || p.status === status) &&
        (!from || dayKey(p.registeredAt) >= from) &&
        (!to || dayKey(p.registeredAt) <= to) &&
        (!s || p.name.toLowerCase().includes(s) || p.mobile.includes(s) || p.email.toLowerCase().includes(s)),
    );
  }, [rows, q, game, status, from, to]);
  useEffect(() => setPage(0), [q, game, status, from, to]);
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const note = [game && gameName(game), status && (status === 'finished' ? 'finished only' : 'started only'), from && `from ${from}`, to && `to ${to}`, q && `search "${q}"`].filter(Boolean).join(', ');

  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allOnPage = shown.length > 0 && shown.every((p) => sel.has(p.id));
  const del = async () => {
    setProblem(null);
    setBusy(true);
    try {
      await gameAdminStore.deletePlayers(head, [...sel]);
      notify(`${sel.size} record(s) deleted.`);
      setSel(new Set());
      setConfirmDel(false);
      await reload();
    } catch (e) {
      setProblem(describeSaveError(e, 'The records'));
    } finally {
      setBusy(false);
    }
  };
  const xl = async () => {
    try {
      await exportExcel(list, note);
    } catch (_e) {
      notify('The Excel file could not be made. Try the CSV export.', false);
    }
  };

  const input = 'px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500';
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <label className="lg:col-span-2 text-xs font-bold text-slate-600">
            Search
            <div className="relative mt-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, mobile or email" className={`${input} w-full pl-9`} />
            </div>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Game
            <select value={game} onChange={(e) => setGame(e.target.value)} className={`${input} w-full mt-1`}>
              <option value="">All games</option>
              {GAME_LIST.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${input} w-full mt-1`}>
              <option value="">All</option>
              <option value="finished">Finished</option>
              <option value="started">Started, not finished</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-600">
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${input} w-full mt-1`} />
          </label>
          <label className="text-xs font-bold text-slate-600">
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${input} w-full mt-1`} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <p className="text-sm text-slate-600 mr-auto">
            <b className="text-slate-900">{list.length.toLocaleString('en-IN')}</b> of {rows.length.toLocaleString('en-IN')} players{note ? ` · ${note}` : ''}
          </p>
          {sel.size > 0 &&
            (confirmDel ? (
              <>
                <span className="text-xs font-semibold text-rose-700">Delete {sel.size} record(s) for good?</span>
                <button onClick={del} disabled={busy} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer">{busy ? 'Deleting…' : 'Yes, delete'}</button>
                <button onClick={() => setConfirmDel(false)} className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold cursor-pointer">Cancel</button>
              </>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Delete selected ({sel.size})
              </button>
            ))}
          <button onClick={() => exportCsv(list)} disabled={!list.length} className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={xl} disabled={!list.length} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
        {problem && <div className="mt-3"><SaveErrorNotice problem={problem} /></div>}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={() => setSel((s) => { const n = new Set(s); shown.forEach((p) => (allOnPage ? n.delete(p.id) : n.add(p.id))); return n; })} /></th>
                <th className="p-3 text-left">Registered</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Game</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Result</th>
                <th className="p-3 text-right">Score</th>
                {game === 'aadupuli' && (
                  <>
                    <th className="p-3 text-left">Difficulty</th>
                    <th className="p-3 text-left">Assets chosen order</th>
                    <th className="p-3 text-right">Bonus goats</th>
                    <th className="p-3 text-left">Emergency fund used</th>
                    <th className="p-3 text-left">News cards seen</th>
                  </>
                )}
                <th className="p-3 text-left hidden lg:table-cell">Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className={`hover:bg-slate-50 cursor-pointer ${open === p.id ? 'bg-indigo-50/40' : ''}`} onClick={() => setOpen(open === p.id ? null : p.id)}>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${p.name}`} checked={sel.has(p.id)} onChange={() => toggle(p.id)} /></td>
                    <td className="p-3 whitespace-nowrap text-slate-600">{when(p.registeredAt)}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.mobile}{p.email ? ` · ${p.email}` : ''}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">{GAME_LIST.find((g) => g.id === p.game)?.icon} {p.gameName}</td>
                    <td className="p-3"><StatusPill s={p.status} /></td>
                    <td className="p-3">{p.result}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">{inr(p.score)}</td>
                    {game === 'aadupuli' && (
                      <>
                        <td className="p-3">{String(p.details?.difficulty ?? '')}</td>
                        <td className="p-3 text-xs min-w-[220px]">{String(p.details?.assetOrder ?? '')}</td>
                        <td className="p-3 text-right">{String(p.details?.bonusGoats ?? '')}</td>
                        <td className="p-3">{String(p.details?.emergencyFundUsed ?? '')}</td>
                        <td className="p-3 text-xs min-w-[220px]">{String(p.details?.newsCards ?? '')}</td>
                      </>
                    )}
                    <td className="p-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">{deviceLabel(p.device)}</td>
                  </tr>
                  {open === p.id && (
                    <tr className="bg-indigo-50/40">
                      <td />
                      <td colSpan={game === 'aadupuli' ? 12 : 7} className="p-3 pt-0 text-xs text-slate-600">
                        <div className="grid sm:grid-cols-3 gap-x-6 gap-y-1">
                          <span><b>Age:</b> {p.age || '-'}</span>
                          <span><b>Language:</b> {p.lang === 'ta' ? 'Tamil' : p.lang === 'en' ? 'English' : p.lang || '-'}</span>
                          <span><b>Mode:</b> {p.mode || '-'}</span>
                          <span><b>Device:</b> {deviceLabel(p.device) || '-'}</span>
                          <span><b>Finished:</b> {when(p.finishedAt) || '-'}</span>
                          <span><b>Record:</b> {p.id}</span>
                        </div>
                        {p.details && <p className="mt-2"><b>Details:</b> {detailsText(p.details)}</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!shown.length && (
                <tr><td colSpan={game === 'aadupuli' ? 13 : 8} className="p-8 text-center text-slate-500">No players match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {list.length > PAGE && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Showing {page * PAGE + 1}–{Math.min(list.length, page * PAGE + PAGE)} of {list.length}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 font-bold cursor-pointer">Previous</button>
              <button disabled={(page + 1) * PAGE >= list.length} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 font-bold cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ games */
const Games: React.FC<{ hub: HubSettings; head: User; onSaved: (h: HubSettings) => void; notify: (m: string, ok?: boolean) => void }> = ({ hub, head, onSaved, notify }) => {
  const [d, setD] = useState<HubSettings>(hub);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<SaveProblem | null>(null);
  // Only take the stored settings when they really changed (the 60-second refresh must not wipe unsaved edits)
  useEffect(() => setD(hub), [hub.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = JSON.stringify(cleanHub(d)) !== JSON.stringify(cleanHub(hub)) || d.mover !== hub.mover || d.downloads !== hub.downloads;
  const move = (i: number, by: number) => setD((x) => { const o = [...x.order]; const j = i + by; if (j < 0 || j >= o.length) return x; [o[i], o[j]] = [o[j], o[i]]; return { ...x, order: o }; });
  const flip = (key: 'enabled' | 'onePlay', id: string) => setD((x) => ({ ...x, [key]: { ...x[key], [id]: x[key][id] === false } }));
  const save = async () => {
    setProblem(null);
    setBusy(true);
    try {
      const s = await gameAdminStore.saveHub(head, d);
      onSaved(s);
      notify('Games saved. The games site and apps show the change the next time they are opened online.');
    } catch (e) {
      setProblem(describeSaveError(e, 'The game settings'));
    } finally {
      setBusy(false);
    }
  };
  const Switch: React.FC<{ on: boolean; label: string; onClick: () => void }> = ({ on, label, onClick }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
  return (
    <div className="space-y-4 max-w-4xl">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-sm font-bold text-slate-900">Which games players see, and in what order</p>
          <p className="text-xs text-slate-500">
            The games site and apps show the switched-on games in this order.{hub.updatedAt ? ` Last changed by ${hub.updatedBy || 'Head'} on ${when(hub.updatedAt)}.` : ''}
          </p>
        </div>
        <button onClick={save} disabled={busy || !dirty} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </Card>
      {problem && <SaveErrorNotice problem={problem} />}
      <Card className={`p-4 flex flex-wrap items-center gap-3 ${d.downloads ? '' : 'bg-slate-50'}`}>
        <span className="text-2xl w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">⬇️</span>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-bold text-slate-900">"Download the app" option on the games site</p>
          <p className="text-[11px] text-slate-500">
            {d.downloads
              ? 'Shown: players see the Download the app button and the download page (Windows, Mac, Android, iPhone).'
              : 'Hidden: no Download button, and the download page says downloads are not available yet. Players can still play on the website.'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {d.downloads ? 'Shown' : 'Hidden'} <Switch on={d.downloads} label="Show the Download the app option" onClick={() => setD((x) => ({ ...x, downloads: !x.downloads }))} />
        </label>
      </Card>
      <Card className="divide-y divide-slate-100">
        {d.order.map((id, i) => {
          const g = GAME_LIST.find((x) => x.id === id)!;
          const on = d.enabled[id] !== false;
          return (
            <div key={id} className={`p-4 flex flex-wrap items-center gap-3 ${on ? '' : 'bg-slate-50'}`}>
              <div className="flex flex-col gap-1">
                <button aria-label={`Move ${g.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="p-1 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button aria-label={`Move ${g.name} down`} disabled={i === d.order.length - 1} onClick={() => move(i, 1)} className="p-1 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <span className="text-2xl w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">{g.icon}</span>
              <div className="flex-1 min-w-[180px]">
                <p className={`text-sm font-bold ${on ? 'text-slate-900' : 'text-slate-500'}`}>{i + 1}. {g.name}</p>
                <p className="text-[11px] text-slate-500">{g.who}</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                One play per mobile <Switch on={d.onePlay[id] !== false} label={`One play per mobile for ${g.name}`} onClick={() => flip('onePlay', id)} />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                {on ? 'Shown' : 'Hidden'} <Switch on={on} label={`Show ${g.name}`} onClick={() => flip('enabled', id)} />
              </label>
              {id === 'investment' && (
                <div className="w-full sm:ml-14 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">Players move with:</span>
                  {([['dice', 'Dice', Dices], ['spinner', 'Spinning wheel', Disc3]] as const).map(([v, label, Icon]) => (
                    <button key={v} type="button" role="radio" aria-checked={d.mover === v} onClick={() => setD((x) => ({ ...x, mover: v }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 cursor-pointer ${d.mover === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600'}`}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>
      <p className="text-[11px] text-slate-500">
        With "One play per mobile" on, a mobile number can play that game only once, on any phone or computer. Switch it off for practice sessions where the same people play again.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ app */
export const GameAdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem(SESSION) || 'null') as User | null;
      return u && u.role === 'head' ? u : null;
    } catch {
      return null;
    }
  });
  const [tab, setTab] = useState<Tab>('dashboard');
  const [rows, setRows] = useState<GamePlayer[]>([]);
  const [hub, setHub] = useState<HubSettings>(cleanHub(undefined));
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const [game, setGame] = useState('');
  const [toast, setToast] = useState<{ m: string; ok: boolean } | null>(null);

  const notify = useCallback((m: string, ok = true) => {
    setToast({ m, ok });
    window.setTimeout(() => setToast(null), 4500);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const [r, h] = await Promise.all([gameAdminStore.listPlayers(), gameAdminStore.getHub()]);
      setRows(r);
      setHub(h);
    } catch (e) {
      setLoadErr(describeSaveError(e, 'The player records').message.replace('could not be saved', 'could not be loaded'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    load();
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
  }, [user, load]);

  if (!user)
    return (
      <Login
        onIn={(u) => {
          try {
            sessionStorage.setItem(SESSION, JSON.stringify(u));
          } catch {
            /* not kept */
          }
          setUser(u);
        }}
      />
    );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={mcubeLogo} alt="Mcube Academy" className="h-9 w-auto" />
          <div className="mr-auto min-w-0">
            <p className="text-sm sm:text-base font-black text-slate-900 leading-tight">Mcube Game Admin</p>
            <p className="text-[11px] text-slate-500 truncate">{user.name}</p>
          </div>
          <button onClick={load} disabled={loading} title="Refresh" className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(SESSION);
              } catch {
                /* nothing */
              }
              setUser(null);
            }}
            className="px-3 py-2 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto" aria-label="Sections">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`px-3 py-2.5 text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {t.icon} {t.label}
              {t.id === 'players' && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{rows.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        {loadErr && (
          <p className="mb-4 flex items-start gap-2 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {loadErr}
          </p>
        )}
        {tab === 'dashboard' && <Dashboard rows={rows} hub={hub} go={(g) => { setGame(g); setTab('players'); }} />}
        {tab === 'players' && <Players rows={rows} head={user} game={game} setGame={setGame} reload={load} notify={notify} />}
        {tab === 'games' && <Games hub={hub} head={user} onSaved={setHub} notify={notify} />}
        {tab === 'settings' && (
          <div className="space-y-4 max-w-3xl">
            <GameStaffPin currentUser={user} onNotify={(m, t) => notify(m, t !== 'error')} />
            <Card className="p-5 space-y-2">
              <p className="text-sm font-bold text-slate-900">Games site and apps</p>
              <p className="text-xs text-slate-500">
                Players register in each game with their name and mobile number. Their registration and result are saved here automatically, from the website and from the
                Windows, Mac, Android and iPhone apps. Games played without internet are sent when the device is online again.
              </p>
              {GAMES_SITE && (
                <a href={GAMES_SITE} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                  Open the games site <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </Card>
          </div>
        )}
      </main>

      {toast && (
        <div role="status" className={`fixed bottom-4 right-4 left-4 sm:left-auto max-w-md z-50 rounded-xl border shadow-lg p-3 text-sm font-semibold flex items-start gap-2 ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="flex-1">{toast.m}</span>
          <button onClick={() => setToast(null)} aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

export default GameAdminApp;

import React from 'react';
import { Search, Filter, X } from 'lucide-react';

const BASE =
  'px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500';

export const SearchBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="relative min-w-[200px] flex-1 sm:flex-none sm:w-64">
    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${BASE} w-full pl-8 pr-3`}
    />
  </div>
);

export const SelectFilter: React.FC<{
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}> = ({ value, onChange, allLabel, options, ariaLabel }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={ariaLabel || allLabel}
    className={BASE}
  >
    <option value="ALL">{allLabel}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export const DateRangeFilter: React.FC<{
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}> = ({ from, to, onFrom, onTo }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
    <span>From</span>
    <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={BASE} aria-label="From date" />
    <span>To</span>
    <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={BASE} aria-label="To date" />
  </div>
);

export const ClearFilters: React.FC<{ show: boolean; onClick: () => void }> = ({ show, onClick }) =>
  show ? (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1.5 rounded-md text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 cursor-pointer"
    >
      <X className="w-3 h-3" />
      Clear filters
    </button>
  ) : null;

/** Card wrapper that gives every admin screen the same filter bar look. */
export const FilterBar: React.FC<{ children: React.ReactNode; summary?: string }> = ({ children, summary }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center gap-2">
    <Filter className="w-3.5 h-3.5 text-slate-400" />
    {children}
    {summary && <span className="ml-auto text-[11px] font-semibold text-slate-500">{summary}</span>}
  </div>
);

/** yyyy-mm-dd of an ISO timestamp, in local time */
export const isoDay = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

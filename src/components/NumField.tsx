import React from 'react';

interface NumFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  suffix?: string;
  prefix?: React.ReactNode;
  integer?: boolean;
  placeholder?: string;
}

/** Number box that keeps what the person types (no jumping while typing) and shows its own error. */
export const NumField: React.FC<NumFieldProps> = ({
  label,
  value,
  onChange,
  error,
  hint,
  suffix,
  prefix,
  integer,
  placeholder,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2">{prefix}</span>}
      <input
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(integer ? /[^0-9]/g : /[^0-9.]/g, ''))}
        aria-invalid={!!error}
        className={`w-full ${prefix ? 'pl-9' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'} py-2 text-sm font-bold text-slate-900 border rounded-lg focus:outline-hidden focus:ring-2 ${
          error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-indigo-500'
        }`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{suffix}</span>
      )}
    </div>
    {error ? (
      <p className="text-[11px] font-semibold text-rose-600 mt-1">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-slate-500 mt-1">{hint}</p>
    ) : null}
  </div>
);

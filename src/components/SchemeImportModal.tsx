import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Download, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { InvestmentScheme } from '../types';
import {
  SCHEME_COLUMNS,
  MAX_IMPORT_ROWS,
  ParsedSchemeRow,
  downloadSchemeTemplate,
  parseSchemeExcel,
} from '../utils/schemeExcel';

interface SchemeImportModalProps {
  schemes: InvestmentScheme[];
  onCreateScheme: (scheme: Omit<InvestmentScheme, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateScheme: (id: string, updates: Partial<InvestmentScheme>) => Promise<void>;
  onClose: () => void;
}

export const SchemeImportModal: React.FC<SchemeImportModalProps> = ({
  schemes,
  onCreateScheme,
  onUpdateScheme,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedSchemeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; failed: string[] } | null>(null);

  const valid = (rows || []).filter((r) => r.action !== 'invalid');
  const invalidCount = (rows || []).length - valid.length;
  const createCount = valid.filter((r) => r.action === 'create').length;
  const updateCount = valid.filter((r) => r.action === 'update').length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setRows(null);
    setResult(null);
    setFileName(file.name);
    setBusy(true);
    try {
      setRows(await parseSchemeExcel(file, schemes));
    } catch (err) {
      setFileName(null);
      setError(err instanceof Error ? err.message : 'Could not read this file.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleTemplate = async () => {
    try {
      await downloadSchemeTemplate();
    } catch (_e) {
      setError('Could not create the template file. Please try again.');
    }
  };

  const handleImport = async () => {
    setBusy(true);
    setError(null);
    let created = 0;
    let updated = 0;
    const failed: string[] = [];
    setProgress({ done: 0, total: valid.length });
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        if (row.action === 'update' && row.existingId) {
          await onUpdateScheme(row.existingId, row.data!);
          updated++;
        } else {
          await onCreateScheme(row.data!);
          created++;
        }
      } catch (err) {
        failed.push(`Row ${row.rowNumber}: ${err instanceof Error ? err.message : 'could not be saved'}`);
      }
      setProgress({ done: i + 1, total: valid.length });
    }
    setProgress(null);
    setBusy(false);
    setRows(null);
    setFileName(null);
    setResult({ created, updated, failed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel Import
            </span>
            <h3 className="text-base font-bold mt-0.5">Import Mutual Fund & NPS Schemes</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Format */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 text-sm">Excel format (.xlsx only)</p>
                <p className="text-slate-500 mt-0.5">
                  Put the headings below in row 1 and one scheme per row from row 2 (up to {MAX_IMPORT_ROWS} rows).
                </p>
              </div>
              <button
                type="button"
                onClick={handleTemplate}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Excel Template
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Column heading</th>
                    <th className="px-3 py-2">Required</th>
                    <th className="px-3 py-2">What to enter</th>
                    <th className="px-3 py-2">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SCHEME_COLUMNS.map((c) => (
                    <tr key={c.key}>
                      <td className="px-3 py-2 font-bold text-slate-800 whitespace-nowrap">{c.header}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.required ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {c.required ? 'Yes' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{c.help}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{c.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-500">
              A scheme with the same Type and Name that already exists is updated instead of added twice.
            </p>
          </div>

          {/* Upload */}
          <div>
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white px-4 py-6 cursor-pointer text-center">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-slate-800">
                {fileName ? fileName : 'Choose your Excel file (.xlsx)'}
              </span>
              <span className="text-slate-400">Only .xlsx Excel files are accepted (max 5 MB)</span>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                disabled={busy}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {busy && !progress && <p className="text-slate-500 font-semibold">Reading the file…</p>}
          {progress && (
            <p className="text-indigo-700 font-semibold">
              Importing {progress.done} of {progress.total}…
            </p>
          )}

          {/* Preview */}
          {rows && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 font-bold">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">{createCount} new</span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">{updateCount} will update</span>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">{invalidCount} with errors (skipped)</span>
              </div>
              <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Scheme</th>
                      <th className="px-3 py-2">Return</th>
                      <th className="px-3 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.rowNumber} className={r.action === 'invalid' ? 'bg-rose-50/60' : ''}>
                        <td className="px-3 py-2 text-slate-500">{r.rowNumber}</td>
                        <td className="px-3 py-2">{r.data ? (r.data.type === 'nps' ? 'NPS' : 'Mutual Fund') : '—'}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{r.data?.name || '—'}</td>
                        <td className="px-3 py-2">{r.data ? `${r.data.expectedReturnRate}%` : '—'}</td>
                        <td className="px-3 py-2">
                          {r.action === 'invalid' ? (
                            <span className="text-rose-700 font-semibold">{r.errors.join('; ')}</span>
                          ) : r.action === 'update' ? (
                            <span className="text-amber-700 font-bold">Update existing</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Add new</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <p className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Import finished
              </p>
              <p className="text-emerald-800">
                {result.created} added, {result.updated} updated
                {result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}.
              </p>
              {result.failed.map((f) => (
                <p key={f} className="text-rose-700">
                  {f}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 cursor-pointer disabled:opacity-40"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {rows && (
            <button
              type="button"
              onClick={handleImport}
              disabled={busy || valid.length === 0}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer disabled:opacity-40"
            >
              Import {valid.length} scheme{valid.length === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

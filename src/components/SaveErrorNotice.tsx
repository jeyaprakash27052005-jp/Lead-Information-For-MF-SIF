import React, { useState } from 'react';
import { AlertCircle, Copy, Check } from 'lucide-react';
// The exact rules file of this project, so an admin can copy it into the Firebase console
import rulesText from '../../firestore.rules?raw';

export interface SaveProblem {
  message: string;
  isRules: boolean;
  detail?: string;
}

/** Turns a failed save into ONE clear message (and says what to do when the database rules are the cause) */
export const describeSaveError = (e: unknown, what: string): SaveProblem => {
  let raw = e instanceof Error ? e.message : String(e);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.error === 'string') raw = parsed.error;
  } catch (_err) {
    // plain text
  }
  const low = raw.toLowerCase();
  if (low.includes('permission') || low.includes('insufficient')) {
    return {
      isRules: true,
      detail: raw,
      message: `${what} could not be saved: the online database is blocking it. The updated Firestore rules have not been published in Firebase yet.`,
    };
  }
  if (low.includes('unavailable') || low.includes('offline') || low.includes('network') || low.includes('failed to fetch')) {
    return { isRules: false, detail: raw, message: `${what} could not be saved: the online database could not be reached. Check the internet connection and try again.` };
  }
  return { isRules: false, detail: raw, message: `${what} could not be saved. ${raw}` };
};

export const SaveErrorNotice: React.FC<{ problem: SaveProblem | null }> = ({ problem }) => {
  const [copied, setCopied] = useState(false);
  if (!problem) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rulesText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_e) {
      setCopied(false);
    }
  };

  return (
    <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 space-y-2">
      <p className="flex items-start gap-1.5 font-bold">
        <AlertCircle className="w-4 h-4 shrink-0" /> {problem.message}
      </p>
      {problem.isRules && (
        <>
          <ol className="list-decimal pl-5 space-y-0.5 text-rose-800">
            <li>Press the button below to copy the rules.</li>
            <li>Open the Firebase console, then Firestore Database, then the Rules tab.</li>
            <li>Replace everything there with the copied rules and press Publish.</li>
            <li>Come back here and save again.</li>
          </ol>
          <button
            type="button"
            onClick={copy}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Rules copied' : 'Copy the Firestore rules'}
          </button>
        </>
      )}
      {problem.detail && <p className="text-[11px] text-rose-700/80">Details: {problem.detail}</p>}
    </div>
  );
};

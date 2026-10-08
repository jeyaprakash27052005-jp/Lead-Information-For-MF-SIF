import React from 'react';
import { Lead } from '../types';

const Chip: React.FC<{ on: boolean; label: string; title?: string }> = ({ on, label, title }) => (
  <span
    title={title ?? `${label}: ${on ? 'Yes' : 'No'}`}
    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
      on
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-slate-50 text-slate-400 border-slate-200'
    }`}
  >
    <span aria-hidden>{on ? '✓' : '✗'}</span>
    {label}
  </span>
);

/** Small PAN / Demat / KYC / SIP status chips for a lead */
export const ReadinessChips: React.FC<{ lead: Lead }> = ({ lead }) => (
  <div className="flex flex-wrap gap-1 mt-1.5">
    <Chip
      on={!!lead.panAvailable}
      label="PAN"
      title={lead.panAvailable ? `PAN available${lead.panNumber ? `: ${lead.panNumber}` : ''}` : 'PAN not available'}
    />
    <Chip on={!!lead.dematAvailable} label="Demat" title={`Demat account: ${lead.dematAvailable ? 'Available' : 'Not available'}`} />
    <Chip on={!!lead.kycComplete} label="KYC" title={`KYC: ${lead.kycComplete ? 'Complete' : 'Not complete'}`} />
    <Chip on={!!lead.sipAutopayActive} label="SIP Auto-pay" title={`SIP auto-payment: ${lead.sipAutopayActive ? 'Activated' : 'Not activated'}`} />
  </div>
);

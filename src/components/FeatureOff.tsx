import React from 'react';
import { PowerOff } from 'lucide-react';

/** Shown to the public when an admin has switched a portal or feature off */
export const FeatureOff: React.FC<{ title: string; message?: string }> = ({ title, message }) => (
  <div className="max-w-md mx-auto my-10 bg-white border border-slate-200 rounded-2xl shadow-xs p-8 text-center space-y-3">
    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
      <PowerOff className="w-6 h-6" />
    </div>
    <h2 className="text-base font-black text-slate-900">{title}</h2>
    <p className="text-xs text-slate-500">{message || 'This service is switched off for now. Please try again later or contact your relationship officer.'}</p>
  </div>
);

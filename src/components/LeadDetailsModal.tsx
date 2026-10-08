import React from 'react';
import { Lead } from '../types';
import {
  X,
  User,
  IndianRupee,
  Briefcase,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Edit,
  ArrowRight
} from 'lucide-react';
import { formatInr, formatInrCompact, formatInrNumber } from '../utils/currency';
import { formatIndianMobile } from '../utils/validation';

interface LeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenStatusModal: (lead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  onClose,
  onOpenStatusModal,
  onOpenEditModal,
}) => {
  if (!lead) return null;

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Ready to Invest':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Process':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'Other':
        return 'bg-purple-50 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formattedIncome = formatInr(lead.annualIncome);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Window Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Lead Dossier: {lead.name}
              </h2>
              <p className="text-xs text-slate-300">
                Lead ID: <span className="font-mono text-indigo-200">{lead.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status & Creator Hero Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Card */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Pipeline Status
              </span>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${getStatusColor(
                    lead.status
                  )}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lead.status}
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenStatusModal(lead);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  Update Status <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Added By & Designation Card - Explicit Requirement */}
            <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Originating Officer (Added By)
              </span>
              <div className="mt-2">
                <p className="text-sm font-bold text-slate-900">
                  {lead.addedByName}
                </p>
                <p className="text-xs font-medium text-indigo-700">
                  Designation: {lead.addedByDesignation}
                </p>
              </div>
            </div>
          </div>

          {/* Lead Information Grid */}
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Personal & Financial Profile
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-slate-200 text-xs">
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Full Name</span>
                <span className="font-semibold text-slate-900 text-sm">{lead.name}</span>
              </div>
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Age</span>
                <span className="font-semibold text-slate-900 text-sm">{lead.age} yrs</span>
              </div>
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Gender</span>
                <span className="font-semibold text-slate-900 text-sm">{lead.gender}</span>
              </div>
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Annual Income</span>
                <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {formattedIncome}
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Mobile Number</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {lead.mobile ? formatIndianMobile(lead.mobile) : 'Not recorded'}
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-slate-500 block text-[11px]">Occupation</span>
                <span className="font-semibold text-slate-900 text-sm flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {lead.occupation}
                </span>
              </div>
            </div>
          </div>

          {/* Investment readiness */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="mb-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              Investment Readiness
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['PAN', lead.panAvailable ? `Available${lead.panNumber ? ` (${lead.panNumber})` : ''}` : 'Not available', !!lead.panAvailable],
                ['Demat Account', lead.dematAvailable ? 'Available' : 'Not available', !!lead.dematAvailable],
                ['KYC', lead.kycComplete ? 'Complete' : 'Not complete', !!lead.kycComplete],
                ['SIP Auto-payment', lead.sipAutopayActive ? 'Activated' : 'Not activated', !!lead.sipAutopayActive],
              ].map(([label, value, on]) => (
                <div
                  key={label as string}
                  className={`p-2.5 rounded-md border ${on ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
                >
                  <span className="text-slate-500 block text-[11px]">{label as string}</span>
                  <span className={`font-semibold ${on ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {on ? '✓ ' : '✗ '}
                    {value as string}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Narration for any other savings (optional) */}
          <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200">
            <div className="flex items-center gap-1.5 mb-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Narration For Any Other Saving / Investments <span className="normal-case font-medium text-amber-700/70">(optional)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white p-3 rounded border border-amber-100">
              {lead.narration || 'No additional saving narration recorded.'}
            </p>
          </div>

          {/* Other Status Narration (When Status is Other) */}
          {lead.status === 'Other' && lead.otherStatusNarration && (
            <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-200">
              <div className="flex items-center gap-1.5 mb-1.5 text-purple-900 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-purple-700" />
                Separate Narration for Other Status
              </div>
              <p className="text-xs sm:text-sm text-purple-900 leading-relaxed whitespace-pre-line bg-white p-3 rounded border border-purple-100">
                {lead.otherStatusNarration}
              </p>
            </div>
          )}

          {/* Status Remarks & Territory Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-1 font-semibold uppercase">
                Status Remarks & Notes
              </span>
              <p className="text-slate-800">
                {lead.statusRemarks || 'No remarks provided.'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px] mb-1 font-semibold uppercase">
                Territory & Assignment
              </span>
              <p className="text-slate-800">
                <strong>Region:</strong> {lead.assignedRegion}
              </p>
              <p className="text-slate-800 mt-0.5">
                <strong>Team Member:</strong> {lead.assignedTeamMember || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Meta timestamps */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created: {new Date(lead.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated: {new Date(lead.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenEditModal(lead);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Lead
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenStatusModal(lead);
              }}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
            >
              Update Lead Status
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

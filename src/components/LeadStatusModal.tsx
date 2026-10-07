import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import {
  X,
  Activity,
  CheckCircle2,
  IndianRupee,
  Briefcase,
  FileText,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { formatInr, formatInrCompact, formatInrNumber } from '../utils/currency';

interface LeadStatusModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSaveStatus: (
    id: string,
    newStatus: LeadStatus,
    remarks: string,
    otherStatusNarration?: string
  ) => Promise<void>;
}

const STATUS_OPTIONS: {
  value: LeadStatus;
  label: string;
  desc: string;
  color: string;
  badge: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'Pending',
    label: 'Pending',
    desc: 'Initial stage, awaiting response or scheduling callback',
    color: 'border-amber-300 text-amber-800 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
  },
  {
    value: 'Ready to Invest',
    label: 'Ready to Invest',
    desc: 'Client is fully prepared to commit capital and proceed with wealth allocation',
    color: 'border-emerald-300 text-emerald-800 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  },
  {
    value: 'Process',
    label: 'Process',
    desc: 'Documentation, KYC verification, or portfolio proposal actively underway',
    color: 'border-indigo-300 text-indigo-800 bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-800',
    icon: <TrendingUp className="w-4 h-4 text-indigo-600" />,
  },
  {
    value: 'Other',
    label: 'Other',
    desc: 'Special case, conditional hold, or bespoke scenario (requires separate narration)',
    color: 'border-purple-300 text-purple-800 bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    icon: <HelpCircle className="w-4 h-4 text-purple-600" />,
  },
];

const LeadStatusModalInner: React.FC<Omit<LeadStatusModalProps, 'lead'> & { lead: Lead }> = ({
  lead,
  onClose,
  onSaveStatus,
}) => {

  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(lead.status);
  const [remarks, setRemarks] = useState(lead.statusRemarks || '');
  const [otherStatusNarration, setOtherStatusNarration] = useState(
    lead.otherStatusNarration || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedIncome = formatInr(lead.annualIncome);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === 'Other' && !otherStatusNarration.trim()) {
      setError('Please provide the separate narration explaining the Other status.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSaveStatus(
        lead.id,
        selectedStatus,
        remarks,
        selectedStatus === 'Other' ? otherStatusNarration.trim() : undefined
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

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
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Update Lead Status: {lead.name}
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Originating Officer Information (Added by Name & Designation only) */}
            <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Lead Added By (Originating Officer)
                  </span>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {lead.addedByName}
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-semibold text-indigo-800">
                      Designation: {lead.addedByDesignation}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Origin Verification
              </span>
            </div>

            {/* Profile Summary & Narration for any other savings */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lead Profile Summary
                </h3>
                <span className="text-[11px] text-slate-500">
                  Region: {lead.assignedRegion}
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lead Name</span>
                  <span className="font-semibold text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                    {lead.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Demographics</span>
                  <span className="font-semibold text-slate-900 text-xs mt-0.5 block">
                    {lead.age} yrs • {lead.gender}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Annual Income</span>
                  <span className="font-bold text-emerald-700 text-xs flex items-center gap-0.5 mt-0.5">
                    <IndianRupee className="w-3 h-3" />
                    {formattedIncome}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Occupation</span>
                  <span className="font-semibold text-slate-900 text-xs flex items-center gap-1 mt-0.5 truncate" title={lead.occupation}>
                    <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                    {lead.occupation}
                  </span>
                </div>
              </div>

              {/* Narration for any other savings */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block text-[11px] mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-400" />
                  Narration for Any Other Savings:
                </span>
                <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                  "{lead.narration || 'No additional saving narration recorded.'}"
                </p>
              </div>
            </div>

            {/* STATUS CHECKLIST: Pending, Ready to Invest, Process, Other */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lead Status Checklist <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Select one of the 4 options
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = selectedStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedStatus(opt.value)}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? `${opt.color} ring-2 ring-indigo-500 shadow-xs font-semibold`
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 shrink-0 flex items-center justify-center border ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          opt.icon
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {opt.label}
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MANDATORY USER REQUIREMENT: Separate Narration when 'Other' option is selected */}
            {selectedStatus === 'Other' && (
              <div className="p-4 rounded-lg bg-purple-50/70 border border-purple-200 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 mb-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-700" />
                  <label className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Separate Narration for Other Status <span className="text-rose-500">*</span>
                  </label>
                </div>
                <p className="text-[11px] text-purple-700 mb-2">
                  Since you selected "Other", please enter the specific reason, condition, or bespoke narration for this lead.
                </p>
                <textarea
                  required
                  rows={3}
                  value={otherStatusNarration}
                  onChange={(e) => setOtherStatusNarration(e.target.value)}
                  placeholder="e.g. Waiting for business loan disbursement before investing; or client requested callback in Q3 after property liquidation..."
                  className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            )}

            {/* General Status Remarks / Next Steps */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                General Remarks & Next Steps
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Enter remarks, client feedback, scheduled call notes, or next action..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : 'Confirm Status Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Wrapper keeps the early return outside the hooks of the inner component
export const LeadStatusModal: React.FC<LeadStatusModalProps> = (props) =>
  props.lead ? <LeadStatusModalInner key={props.lead.id} {...props} lead={props.lead} /> : null;

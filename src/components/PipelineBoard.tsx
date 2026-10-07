import React, { useState } from 'react';
import { Lead, LeadStatus, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  MoreVertical,
  Eye,
  Activity,
  Edit,
  Trash2,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatInr, formatInrCompact, formatInrNumber } from '../utils/currency';

interface PipelineBoardProps {
  leads: Lead[];
  currentUser: User;
  onViewLead: (lead: Lead) => void;
  onUpdateStatus: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => Promise<void>;
  onQuickMoveStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
}

const COLUMNS: { status: LeadStatus; label: string; headerColor: string }[] = [
  { status: 'Pending', label: '1. Pending', headerColor: 'border-t-amber-500' },
  { status: 'Ready to Invest', label: '2. Ready to Invest', headerColor: 'border-t-emerald-500' },
  { status: 'Process', label: '3. Process', headerColor: 'border-t-indigo-500' },
  { status: 'Other', label: '4. Other', headerColor: 'border-t-purple-500' },
];

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  leads,
  onViewLead,
  onUpdateStatus,
  onEditLead,
  onDeleteLead,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  // Close menus on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.three-dot-board-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Lead Status Pipeline Board
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              Checklist: Pending • Ready to Invest • Process • Other
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor client lifecycles, examine originating officers, and advance lead statuses
          </p>
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.status);
          const colTotalIncome = columnLeads.reduce((acc, l) => acc + l.annualIncome, 0);

          return (
            <div
              key={col.status}
              className={`bg-slate-50/70 rounded-xl border border-slate-200 border-t-4 ${col.headerColor} p-3.5 flex flex-col min-h-[480px] shadow-2xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{col.label}</h3>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {formatInrCompact(colTotalIncome)} volume
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                  {columnLeads.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-[11px] italic">
                    No leads in this stage
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const isMenuOpen = activeMenuId === lead.id;
                    const formattedIncome = formatInr(lead.annualIncome);

                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow relative group"
                      >
                        {/* Card Header: Name + Three-dot Menu */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <button
                              onClick={() => onViewLead(lead)}
                              className="font-bold text-slate-900 text-xs hover:text-indigo-600 hover:underline text-left cursor-pointer"
                            >
                              {lead.name}
                            </button>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {lead.occupation}
                            </div>
                          </div>

                          {/* THREE DOT NAVIGATION BUTTON */}
                          <div className="relative three-dot-board-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : lead.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Lead actions (...)"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-44 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onViewLead(lead);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onUpdateStatus(lead);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Update Status</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onEditLead(lead);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Edit Lead</span>
                                </button>
                                <div className="border-t border-slate-100 pt-1 mt-1">
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setPendingDelete({ id: lead.id, name: lead.name });
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Demographics & Income */}
                        <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {lead.age}y • {lead.gender}
                          </span>
                          <span className="font-bold text-emerald-700 flex items-center">
                            <IndianRupee className="w-3 h-3" />
                            {formattedIncome}
                          </span>
                        </div>

                        {/* Savings Narration Excerpt */}
                        <div className="mt-1.5 p-1.5 rounded bg-slate-50 text-[10px] text-slate-600 line-clamp-2 italic border border-slate-100">
                          "{lead.narration}"
                        </div>

                        {/* Other Status Narration if Other status is active */}
                        {lead.status === 'Other' && lead.otherStatusNarration && (
                          <div className="mt-1.5 p-1.5 rounded bg-purple-50 text-[10px] text-purple-800 line-clamp-2 border border-purple-200">
                            <span className="font-bold">Other Narration:</span> "{lead.otherStatusNarration}"
                          </div>
                        )}

                        {/* ORIGIN OFFICER: Added By Person Name and Designation ONLY */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <div className="truncate">
                            <div className="text-slate-400 uppercase font-semibold text-[9px] flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-indigo-500" />
                              Added By
                            </div>
                            <div className="font-bold text-slate-800 truncate">
                              {lead.addedByName}
                            </div>
                            <div className="text-indigo-600 font-medium truncate">
                              {lead.addedByDesignation}
                            </div>
                          </div>

                          <button
                            onClick={() => onUpdateStatus(lead)}
                            className="p-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0"
                            title="Update Status"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Lead Record"
        message={`Are you sure you want to permanently delete lead "${pendingDelete?.name}"?`}
        confirmLabel="Delete Lead"
        onConfirm={async () => {
          if (pendingDelete) {
            await onDeleteLead(pendingDelete.id);
            setPendingDelete(null);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

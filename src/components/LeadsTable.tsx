import React, { useState } from 'react';
import { Lead, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  MoreVertical,
  Eye,
  Activity,
  Edit,
  Trash2,
  Search,
  Filter,
  IndianRupee,
  User as UserIcon,
  Briefcase,
  FileText,
  ShieldCheck,
  PlusCircle,
  Building2
} from 'lucide-react';
import { formatInr, formatInrCompact, formatInrNumber } from '../utils/currency';

interface LeadsTableProps {
  leads: Lead[];
  currentUser: User;
  onViewLead: (lead: Lead) => void;
  onUpdateStatus: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => Promise<void>;
  onAddNewLead?: () => void;
  title?: string;
  subtitle?: string;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  currentUser,
  onViewLead,
  onUpdateStatus,
  onEditLead,
  onDeleteLead,
  onAddNewLead,
  title = 'All Leads Directory',
  subtitle = 'Universal lead roster visible across all roles',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  // Close three-dot menu on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.three-dot-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStatusBadge = (status: Lead['status']) => {
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

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.addedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesRegion = regionFilter === 'ALL' || lead.assignedRegion === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  const handleDeleteClick = (id: string, name: string) => {
    setActiveMenuId(null);
    setPendingDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeletingId(id);
    try {
      await onDeleteLead(id);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const canAdd = currentUser.role === 'head' || currentUser.role === 'area_incharge';

  return (
    <div className="space-y-4">
      {/* Action and Filter Toolbar - Windows Professional Style */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {filteredLeads.length} leads
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, occupation, notes..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Ready to Invest">Ready to Invest</option>
                <option value="Process">Process</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Regions</option>
              <option value="North Division">North Division</option>
              <option value="South Division">South Division</option>
              <option value="East Division">East Division</option>
              <option value="West Division">West Division</option>
            </select>

            {/* Add Lead Button */}
            {canAdd && onAddNewLead && (
              <button
                onClick={onAddNewLead}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs ml-auto"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Lead</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your search filters or record a new lead into the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Lead Information</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Annual Income</th>
                  <th className="py-3 px-4">Savings Narration</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      Added By (Officer & Designation)
                    </span>
                  </th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const isMenuOpen = activeMenuId === lead.id;
                  const formattedIncome = formatInr(lead.annualIncome);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & Occupation */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <button
                            onClick={() => onViewLead(lead)}
                            className="text-slate-900 hover:text-indigo-600 hover:underline text-left cursor-pointer font-bold"
                          >
                            {lead.name}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{lead.occupation}</span>
                        </div>
                      </td>

                      {/* Demographics */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {lead.age} yrs
                        </span>
                        <span className="text-slate-400 mx-1">•</span>
                        <span className="text-slate-600">{lead.gender}</span>
                      </td>

                      {/* Annual Income */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                          <IndianRupee className="w-3.5 h-3.5" />
                          {formattedIncome}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">per annum</span>
                      </td>

                      {/* Narration for any other saving */}
                      <td className="py-3 px-4 max-w-xs">
                        <div
                          className="text-[11px] text-slate-600 line-clamp-2 italic"
                          title={lead.narration}
                        >
                          <FileText className="w-3 h-3 text-amber-600 inline mr-1 shrink-0" />
                          {lead.narration}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                        {lead.status === 'Other' && lead.otherStatusNarration && (
                          <div
                            className="text-[10px] text-purple-700 italic truncate max-w-[140px] mt-0.5"
                            title={lead.otherStatusNarration}
                          >
                            "{lead.otherStatusNarration}"
                          </div>
                        )}
                        {lead.statusRemarks && (
                          <div
                            className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5"
                            title={lead.statusRemarks}
                          >
                            {lead.statusRemarks}
                          </div>
                        )}
                      </td>

                      {/* Added by: Officer Name & Designation ONLY - Mandatory Requirement */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          {lead.addedByName}
                        </div>
                        <div className="text-[11px] font-medium text-indigo-700 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          <span>{lead.addedByDesignation}</span>
                        </div>
                      </td>

                      {/* THREE-DOT NAVIGATION & ACTION MENU - Mandatory Requirement */}
                      <td className="py-3 px-3 text-right">
                        <div className="relative inline-block text-left three-dot-menu-container">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(isMenuOpen ? null : lead.id);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Navigate actions (...)"
                            aria-label="Three dot menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Popover Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left">
                              <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Lead Actions
                              </div>

                              {/* View Details */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onViewLead(lead);
                                }}
                                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>View Dossier</span>
                              </button>

                              {/* Update Status */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onUpdateStatus(lead);
                                }}
                                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Activity className="w-3.5 h-3.5 text-amber-600" />
                                <span>Update Status</span>
                              </button>

                              {/* Edit Lead */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditLead(lead);
                                }}
                                className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Information</span>
                              </button>

                              {/* Delete Lead */}
                              <div className="pt-1 border-t border-slate-100">
                                <button
                                  onClick={() => handleDeleteClick(lead.id, lead.name)}
                                  disabled={deletingId === lead.id}
                                  className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>{deletingId === lead.id ? 'Deleting...' : 'Delete Lead'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Lead Record"
        message={`Are you sure you want to permanently delete lead "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Lead"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

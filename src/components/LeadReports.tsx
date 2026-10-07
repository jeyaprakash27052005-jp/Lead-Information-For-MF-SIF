import React, { useState } from 'react';
import { Lead, LeadStatus, User } from '../types';
import {
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface LeadReportsProps {
  leads: Lead[];
  currentUser: User;
  onViewLead: (lead: Lead) => void;
}

export const LeadReports: React.FC<LeadReportsProps> = ({
  leads,
  onViewLead,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const regions = ['North Division', 'South Division', 'East Division', 'West Division'];
  const statuses: LeadStatus[] = ['Pending', 'Ready to Invest', 'Process', 'Other'];

  // Filter leads according to selected status and region
  const filteredLeads = leads.filter((l) => {
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const matchesRegion = selectedRegion === 'ALL' || l.assignedRegion === selectedRegion;
    return matchesStatus && matchesRegion;
  });

  // Helper to generate and download CSV
  const downloadCSV = (leadsToExport: Lead[], reportTitle: string) => {
    const headers = [
      'Lead ID',
      'Name',
      'Age',
      'Gender',
      'Annual Income ($)',
      'Occupation',
      'Savings Narration',
      'Status',
      'Other Status Narration',
      'Status Remarks',
      'Added By (Officer Name)',
      'Added By Designation',
      'Assigned Region',
      'Assigned Team Member',
      'Created Date',
    ];

    const rows = leadsToExport.map((l) => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      l.age,
      `"${l.gender}"`,
      l.annualIncome,
      `"${l.occupation.replace(/"/g, '""')}"`,
      `"${(l.narration || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${(l.otherStatusNarration || '').replace(/"/g, '""')}"`,
      `"${(l.statusRemarks || '').replace(/"/g, '""')}"`,
      `"${l.addedByName.replace(/"/g, '""')}"`,
      `"${l.addedByDesignation.replace(/"/g, '""')}"`,
      `"${l.assignedRegion}"`,
      `"${(l.assignedTeamMember || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = filteredLeads.reduce((sum, l) => sum + l.annualIncome, 0);

  const fmt = (num: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="space-y-6">
      {/* Title & Download Format Hub */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Overall Lead Report & Download Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate and download customized lead reports formatted by Status-wise and Regional-wise dimensions
            </p>
          </div>

          {/* Quick Universal Download Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => downloadCSV(filteredLeads, `Lead_Report_Filtered`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              title="Download currently filtered report"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Filtered Report ({filteredLeads.length} Leads)</span>
            </button>

            <button
              onClick={() => downloadCSV(leads, 'All_Leads_Master_Report')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Download entire database of leads"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download All Leads Master CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status-Wise & Regional-Wise Dedicated Download Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Module 1: Status-Wise Download Format */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Status-Wise Download Format
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Direct CSV Export</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Instantly export lead records categorized strictly by customer status:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {statuses.map((st) => {
                const count = leads.filter((l) => l.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      const list = leads.filter((l) => l.status === st);
                      downloadCSV(list, `Status_Wise_${st}`);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 text-left transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                        {st}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {count} {count === 1 ? 'record' : 'records'}
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Module 2: Regional-Wise Download Format */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Regional-Wise Download Format
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Territory Export</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Export comprehensive lead dossiers segregated by geographical territory:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {regions.map((reg) => {
                const count = leads.filter((l) => l.assignedRegion === reg).length;
                return (
                  <button
                    key={reg}
                    onClick={() => {
                      const list = leads.filter((l) => l.assignedRegion === reg);
                      downloadCSV(list, `Regional_Wise_${reg}`);
                    }}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/90 text-left transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                        {reg}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {count} {count === 1 ? 'record' : 'records'}
                      </div>
                    </div>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Report View & Filter Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Report Data Sheet ({filteredLeads.length} Leads • Total Volume: {fmt(totalIncome)})
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Ready to Invest">Ready to Invest</option>
              <option value="Process">Process</option>
              <option value="Other">Other</option>
            </select>

            {/* Regional Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Divisions</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              No leads match the selected status and regional criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Annual Income</th>
                  <th className="py-3 px-4">Savings Narration</th>
                  <th className="py-3 px-4">Status & Narration</th>
                  <th className="py-3 px-4">Division Region</th>
                  <th className="py-3 px-4">Added By Officer</th>
                  <th className="py-3 px-4">Date Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onViewLead(lead)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {lead.name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {lead.age}y • {lead.gender}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        {new Intl.NumberFormat('en-US').format(lead.annualIncome)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-[11px] text-slate-600 truncate italic" title={lead.narration}>
                        {lead.narration}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          lead.status === 'Ready to Invest'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : lead.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : lead.status === 'Process'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-purple-50 text-purple-800 border-purple-300'
                        }`}
                      >
                        {lead.status}
                      </span>
                      {lead.status === 'Other' && lead.otherStatusNarration && (
                        <div
                          className="text-[10px] text-purple-700 italic truncate max-w-[160px] mt-0.5"
                          title={lead.otherStatusNarration}
                        >
                          "{lead.otherStatusNarration}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {lead.assignedRegion}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{lead.addedByName}</div>
                      <div className="text-[10px] text-slate-500">{lead.addedByDesignation}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

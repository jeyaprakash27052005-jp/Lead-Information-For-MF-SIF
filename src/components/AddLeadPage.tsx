import React, { useState } from 'react';
import { Lead, User } from '../types';
import { LeadFormModal } from './LeadFormModal';
import { formatDateTime } from '../utils/dateTime';
import { UserPlus, Clock, Phone } from 'lucide-react';

interface AddLeadPageProps {
  leads: Lead[];
  currentUser: User;
  users: User[];
  regions: string[];
  onSubmit: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onViewLead: (lead: Lead) => void;
  onViewAllLeads: () => void;
}

/** Separate admin page for adding leads, with the most recently stored leads (and the time they were added) below. */
export const AddLeadPage: React.FC<AddLeadPageProps> = ({
  leads,
  currentUser,
  users,
  regions,
  onSubmit,
  onViewLead,
  onViewAllLeads,
}) => {
  const [formKey, setFormKey] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);

  // Head sees the latest leads of everyone; others see the leads they added themselves
  const mine = currentUser.role === 'head' ? leads : leads.filter((l) => l.addedByUserId === currentUser.id);
  const recent = [...mine]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserPlus className="w-4 h-4" />
            Lead Entry
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Add New Lead</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record a new lead with financial profile and savings narration. It is stored in the online database with the date and time.
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllLeads}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer shrink-0"
        >
          View all leads
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          Lead saved. You can add the next lead below.
        </div>
      )}

      <LeadFormModal
        key={formKey}
        variant="page"
        isOpen
        regions={regions}
        onClose={onViewAllLeads}
        onSubmit={onSubmit}
        onSaved={() => {
          setFormKey((k) => k + 1);
          setSavedNotice(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        users={users}
        initialData={null}
      />

      {/* Recently stored leads with time */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden max-w-4xl mx-auto w-full">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {currentUser.role === 'head' ? 'Recently added leads' : 'Leads you added recently'}
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">Latest {recent.length}</span>
        </div>
        {recent.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">No leads stored yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-white border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5">Lead</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Region</th>
                  <th className="px-4 py-2.5">Added by</th>
                  <th className="px-4 py-2.5">Added on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => onViewLead(lead)}
                        className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-left cursor-pointer"
                      >
                        {lead.name}
                      </button>
                      {lead.mobile && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.mobile}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{lead.status}</td>
                    <td className="px-4 py-2.5 text-slate-700">{lead.assignedRegion}</td>
                    <td className="px-4 py-2.5 text-slate-700">{lead.addedByName}</td>
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(lead.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

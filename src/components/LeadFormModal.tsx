import React, { useState } from 'react';
import { Lead, User, LeadStatus } from '../types';
import {
  X,
  UserPlus,
  IndianRupee,
  Briefcase,
  FileText,
  User as UserIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_REGIONS, isHqRegion } from '../utils/regions';
import { formatInr } from '../utils/currency';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  currentUser: User;
  users: User[];
  initialData?: Lead | null;
  regions?: string[];
}

const LeadFormModalInner: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  users,
  initialData,
  regions = DEFAULT_REGIONS,
}) => {

  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState<number | ''>(initialData?.age || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(
    initialData?.gender || 'Male'
  );
  const [annualIncome, setAnnualIncome] = useState<number | ''>(
    initialData?.annualIncome || ''
  );
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [narration, setNarration] = useState(initialData?.narration || '');
  const [status, setStatus] = useState<LeadStatus>(initialData?.status || 'Pending');
  const [otherStatusNarration, setOtherStatusNarration] = useState(
    initialData?.otherStatusNarration || ''
  );
  const [statusRemarks, setStatusRemarks] = useState(
    initialData?.statusRemarks || 'Initial lead entry.'
  );

  // Region and team assignment
  const [assignedRegion, setAssignedRegion] = useState(
    initialData?.assignedRegion ||
      (!isHqRegion(currentUser.region) ? currentUser.region : regions[0] ?? 'North Division')
  );
  const [assignedTeamMember, setAssignedTeamMember] = useState(
    initialData?.assignedTeamMember || currentUser.name
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter lead name');
      return;
    }
    if (!age || Number(age) <= 0) {
      setError('Please enter a valid age');
      return;
    }
    if (annualIncome === '' || Number(annualIncome) < 0) {
      setError('Please enter a valid annual income');
      return;
    }
    if (!occupation.trim()) {
      setError('Please enter lead occupation');
      return;
    }
    if (!narration.trim()) {
      setError('Please provide narration for any other savings or investments');
      return;
    }

    if (status === 'Other' && !otherStatusNarration.trim()) {
      setError('Please provide the separate narration explaining the Other status.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        age: Number(age),
        gender,
        annualIncome: Number(annualIncome),
        occupation: occupation.trim(),
        narration: narration.trim(),
        status,
        statusRemarks: statusRemarks.trim(),
        otherStatusNarration: status === 'Other' ? otherStatusNarration.trim() : undefined,
        addedByUserId: initialData?.addedByUserId || currentUser.id,
        addedByName: initialData?.addedByName || currentUser.name,
        addedByDesignation: initialData?.addedByDesignation || currentUser.designation,
        assignedRegion,
        assignedTeamMember,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lead information');
    } finally {
      setLoading(false);
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {initialData ? 'Edit Lead Dossier' : 'Add New Lead Information'}
              </h2>
              <p className="text-xs text-slate-300">
                Financial customer profile with savings narration
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
          <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Officer Origin Badge */}
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-600 font-medium">Recording Officer:</span>
                <span className="font-bold text-slate-900">
                  {initialData ? initialData.addedByName : currentUser.name}
                </span>
              </div>
              <span className="font-semibold text-indigo-700">
                Designation: {initialData ? initialData.addedByDesignation : currentUser.designation}
              </span>
            </div>

            {/* Core Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Robert Vance"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="e.g. 38"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Annual Income (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={annualIncome}
                    onChange={(e) =>
                      setAnnualIncome(e.target.value ? parseInt(e.target.value, 10) : '')
                    }
                    placeholder="e.g. 1200000"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                  <IndianRupee className="w-3 h-3 shrink-0" />
                  <span>
                    {annualIncome === '' ? '—' : formatInr(Number(annualIncome))}
                  </span>
                </div>
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Occupation <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Senior Software Architect, Orthopedic Surgeon, Entrepreneur"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Narration for any other saving - EXPLICIT USER REQUIREMENT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Narration for Any Other Saving <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Pensions, mutual funds, gold, real estate, deposits
                </span>
              </div>
              <textarea
                required
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={3}
                placeholder="Details of other savings (e.g. ₹5,00,000 in fixed deposits, active mutual fund SIP of ₹10,000/month, gold bonds, commercial property rental return)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status & Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="Ready to Invest">Ready to Invest</option>
                  <option value="Process">Process</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Region
                </label>
                <select
                  value={assignedRegion}
                  onChange={(e) => setAssignedRegion(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {regions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Separate narration if Other status is selected */}
              {status === 'Other' && (
                <div className="sm:col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                    Separate Narration for Other Status <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={otherStatusNarration}
                    onChange={(e) => setOtherStatusNarration(e.target.value)}
                    placeholder="Please specify separate narration for this Other status..."
                    className="w-full px-3 py-1.5 text-xs border border-purple-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Team Member / Incharge
                </label>
                <select
                  value={assignedTeamMember}
                  onChange={(e) => setAssignedTeamMember(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Status Remarks
                </label>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="e.g. Lead submitted following initial webinar consultation"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
            >
              {loading ? 'Saving...' : initialData ? 'Update Lead' : 'Save Lead Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Wrapper keeps the early return outside the hooks of the inner component
export const LeadFormModal: React.FC<LeadFormModalProps> = (props) =>
  props.isOpen ? <LeadFormModalInner {...props} /> : null;

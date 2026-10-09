import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  Building2,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  User as UserIcon,
  X,
  Edit,
  Copy
} from 'lucide-react';
import { DEFAULT_REGIONS, isHqRegion } from '../utils/regions';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser: (userData: {
    username: string;
    password?: string;
    name: string;
    designation: string;
    role: UserRole;
    region: string;
    createdBy: string;
    creatorRole: string;
  }) => Promise<void>;
  onToggleStatus: (userId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onEditUserProfile: (user: User) => void;
  onCreateRegion?: (name: string) => Promise<void>;
  onDeleteRegion?: (name: string) => Promise<void>;
  regions?: string[];
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onAddUser,
  onToggleStatus,
  onDeleteUser,
  onEditUserProfile,
  onCreateRegion,
  onDeleteRegion,
  regions = DEFAULT_REGIONS,
}) => {
  const isHead = currentUser.role === 'head';
  const isRegional = currentUser.role === 'regional_incharge';
  // Head and Regional Incharge can create accounts (Regional Incharge: Area Incharges in own region only)
  const canCreateUsers = isHead || isRegional;

  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<UserRole>('area_incharge');
  const [region, setRegion] = useState(
    !isHqRegion(currentUser.region) ? currentUser.region : regions[0] ?? 'North Division'
  );

  const CREATE_REGION = '__create_new_region__';
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');

  // Region management (Head only)
  const [regionModal, setRegionModal] = useState<'create' | 'delete' | null>(null);
  const [regionInput, setRegionInput] = useState('');
  const [regionToDelete, setRegionToDelete] = useState('');
  const [regionBusy, setRegionBusy] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  const closeRegionModal = () => {
    setRegionModal(null);
    setRegionInput('');
    setRegionToDelete('');
    setRegionError(null);
  };

  const submitCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const typed = regionInput.trim().replace(/\s+/g, ' ');
    if (!typed) {
      setRegionError('Please enter a region name.');
      return;
    }
    if (regions.some((r) => r.toLowerCase() === typed.toLowerCase())) {
      setRegionError(`Region "${typed}" already exists.`);
      return;
    }
    setRegionBusy(true);
    setRegionError(null);
    try {
      await onCreateRegion?.(typed);
      closeRegionModal();
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : 'Failed to create region');
    } finally {
      setRegionBusy(false);
    }
  };

  const submitDeleteRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionToDelete) {
      setRegionError('Please select the region to delete.');
      return;
    }
    setRegionBusy(true);
    setRegionError(null);
    try {
      await onDeleteRegion?.(regionToDelete);
      closeRegionModal();
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : 'Failed to delete region');
    } finally {
      setRegionBusy(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    onConfirm: async () => {},
  });


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !designation.trim()) {
      setError('Please fill all required user fields');
      return;
    }

    // Resolve the region (existing, or a newly created one - Head only)
    let finalRegion = isRegional ? currentUser.region : region;
    if (isHead && isCreatingRegion) {
      const typed = newRegionName.trim().replace(/\s+/g, ' ');
      if (!typed) {
        setError('Please enter the name of the new region');
        return;
      }
      const existing = regions.find((r) => r.toLowerCase() === typed.toLowerCase());
      finalRegion = existing ?? typed;
    }

    setLoading(true);
    setError(null);

    try {
      await onAddUser({
        username: username.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        designation: designation.trim(),
        role: isRegional ? 'area_incharge' : role,
        region: finalRegion,
        createdBy: `${currentUser.name} (${currentUser.designation})`,
        creatorRole: currentUser.role,
      });

      // Reset form
      setUsername('');
      setName('');
      setDesignation('');
      setPassword('password123');
      setIsCreatingRegion(false);
      setNewRegionName('');
      setIsAddModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    const actionName = nextStatus === 'active' ? 'activate' : 'deactivate';

    setConfirmDialog({
      isOpen: true,
      title: `${nextStatus === 'active' ? 'Activate' : 'Deactivate'} User Account`,
      message: `Are you sure you want to ${actionName} user "${user.name}" (@${user.username})?`,
      confirmLabel: nextStatus === 'active' ? 'Activate Account' : 'Deactivate Account',
      isDestructive: nextStatus === 'inactive',
      onConfirm: async () => {
        setActionInProgressId(user.id);
        try {
          await onToggleStatus(user.id, nextStatus);
        } finally {
          setActionInProgressId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDelete = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User Account Permanently',
      message: `Permanently delete account for "${user.name}" (@${user.username})? This action cannot be undone.`,
      confirmLabel: 'Delete Account',
      isDestructive: true,
      onConfirm: async () => {
        setActionInProgressId(user.id);
        try {
          await onDeleteUser(user.id);
        } finally {
          setActionInProgressId(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Permission logic:
  // Head can manage everyone except primary head
  // Regional Incharge can manage Area Incharges in their region/team
  const canManageUser = (target: User) => {
    if (target.id === 'usr_head_1') return false;
    if (target.id === currentUser.id) return false; // cannot delete self
    if (isHead) return true;
    if (isRegional) {
      // Regional can delete or inactivate area_incharge
      return target.role === 'area_incharge';
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & User Creation Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            User Access & Authority Roster
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {users.length} Active Accounts
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHead
              ? 'Head Administrator privilege: Provision Regional Incharges and Area Incharges, deactivate IDs, or delete user accounts.'
              : 'Regional Incharge privilege: Create Area Incharge IDs for your region, deactivate dormant accounts, or remove team members.'}
          </p>
        </div>

        {/* Head and Regional Incharge have the Add Users feature; Head also manages regions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isHead && (
            <>
              <button
                onClick={() => setRegionModal('create')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Create Region</span>
              </button>
              <button
                onClick={() => setRegionModal('delete')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Region</span>
              </button>
            </>
          )}
          {canCreateUsers && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>{isHead ? 'Add New User Account' : 'Add Area Incharge'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-wise Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
          Filter by Role
        </span>
        {([
          ['all', 'All Users'],
          ['head', 'Head'],
          ['regional_incharge', 'Regional Incharge'],
          ['area_incharge', 'Area Incharge'],
          ['customer', 'Customer'],
        ] as const).map(([value, label]) => {
          const count = value === 'all' ? users.length : users.filter((u) => u.role === value).length;
          const active = roleFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRoleFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 rounded-full text-[10px] ${
                  active ? 'bg-slate-700 text-indigo-200' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Account ID & Login</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Assigned Region</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter((u) => roleFilter === 'all' || u.role === roleFilter).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                    No users found for this role.
                  </td>
                </tr>
              )}
              {users.filter((u) => roleFilter === 'all' || u.role === roleFilter).map((u) => {
                const canAct = canManageUser(u);
                const isWorking = actionInProgressId === u.id;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* User Name & Designation */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {u.name}
                        {u.id === currentUser.id && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {u.designation}
                      </div>
                    </td>

                    {/* Username & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800 font-semibold">
                        @{u.username}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {u.id}
                      </div>
                    </td>

                    {/* Role Tier */}
                    <td className="py-3.5 px-4">
                      {u.role === 'head' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ShieldCheck className="w-3 h-3" />
                          Head
                        </span>
                      )}
                      {u.role === 'regional_incharge' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Building2 className="w-3 h-3" />
                          Regional Incharge
                        </span>
                      )}
                      {u.role === 'area_incharge' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <UserCheck className="w-3 h-3" />
                          Area Incharge
                        </span>
                      )}
                    </td>

                    {/* Assigned Region */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{u.region}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Active ID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Inactive ID
                        </span>
                      )}
                    </td>

                    {/* Created By */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.createdBy}
                    </td>

                    {/* Actions: Edit Profile, Toggle Active/Inactive or Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit User Profile - Feature for Head */}
                        {isHead && (
                          <button
                            onClick={() => onEditUserProfile(u)}
                            className="px-2.5 py-1 rounded text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                            title={`Edit profile for ${u.name}`}
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit Profile</span>
                          </button>
                        )}

                        {canAct ? (
                          <>
                            {/* Inactive / Active Toggle - EXPLICIT REQUIREMENT */}
                            <button
                              onClick={() => handleStatusToggle(u)}
                              disabled={isWorking}
                              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                                u.status === 'active'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title={u.status === 'active' ? 'Mark user ID inactive' : 'Reactivate user ID'}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Delete User - EXPLICIT REQUIREMENT */}
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={isWorking}
                              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Delete user permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : !isHead ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Protected System ID
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Create New Organization User
                  </h2>
                  <p className="text-xs text-slate-300">
                    {isHead ? 'Provision Regional Incharge or Area Incharge account' : `Provision Area Incharge account for ${currentUser.region}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Role Tier Selection (Head only; Regional Incharge creates Area Incharges) */}
                {isRegional && (
                  <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/60 flex items-center gap-2 text-xs">
                    <UserCheck className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900">Area Incharge</span>
                    <span className="text-slate-500">• {currentUser.region}</span>
                  </div>
                )}
                {isHead && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select User Type (Role) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRole('regional_incharge');
                        if (!designation) setDesignation('Regional Incharge');
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        role === 'regional_incharge'
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Regional Incharge</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Supervises division, tracks metrics, manages team
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRole('area_incharge');
                        if (!designation) setDesignation('Area Incharge');
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        role === 'area_incharge'
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 text-sky-600 mb-1" />
                      <div className="font-bold text-xs text-slate-900">Area Incharge</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Adds leads, updates status, tracks team reports
                      </div>
                    </button>
                  </div>
                </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Officer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Foster"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Designation - MANDATORY REQUIREMENT */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Designation / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Regional Incharge - Central Division or Area Incharge - East Hub"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Username & Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Login Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder="username"
                        className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Initial Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Region
                  </label>
                  <select
                    value={isRegional ? currentUser.region : isCreatingRegion ? CREATE_REGION : region}
                    disabled={isRegional}
                    onChange={(e) => {
                      if (e.target.value === CREATE_REGION) {
                        setIsCreatingRegion(true);
                      } else {
                        setIsCreatingRegion(false);
                        setRegion(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {(isRegional ? [currentUser.region] : regions).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  {isHead && <option value={CREATE_REGION}>+ Create new region…</option>}
                  </select>
                </div>
                  {isHead && isCreatingRegion && (
                    <input
                      type="text"
                      autoFocus
                      value={newRegionName}
                      onChange={(e) => setNewRegionName(e.target.value)}
                      placeholder="New region name, e.g. Central Division"
                      maxLength={64}
                      className="mt-2 w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-indigo-50/40"
                    />
                  )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  {loading ? 'Creating...' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Delete Region Modal (Head only) */}
      {isHead && regionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {regionModal === 'create' ? 'Create Region' : 'Delete Region'}
                </h2>
              </div>
              <button
                onClick={closeRegionModal}
                className="text-slate-400 hover:text-white p-1 rounded-md"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={regionModal === 'create' ? submitCreateRegion : submitDeleteRegion}>
              <div className="p-6 space-y-3">
                {regionError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regionError}</span>
                  </div>
                )}

                {regionModal === 'create' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Region Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={regionInput}
                      onChange={(e) => setRegionInput(e.target.value)}
                      maxLength={64}
                      placeholder="e.g. Central Division"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      The new region becomes available for users, leads, reports and metrics.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Select Region to Delete <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regionToDelete}
                      onChange={(e) => setRegionToDelete(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Choose a region…</option>
                      {regions.map((r) => {
                        const count = users.filter((u) => u.region.toLowerCase() === r.toLowerCase()).length;
                        return (
                          <option key={r} value={r}>
                            {r} ({count} {count === 1 ? 'account' : 'accounts'})
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      A region can be deleted only when it has no user accounts and no leads.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRegionModal}
                  disabled={regionBusy}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regionBusy}
                  className={`px-5 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-xs ${
                    regionModal === 'create' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {regionBusy
                    ? 'Working...'
                    : regionModal === 'create'
                    ? 'Create Region'
                    : 'Delete Region'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

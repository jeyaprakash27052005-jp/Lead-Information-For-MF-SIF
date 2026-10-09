import React from 'react';
import { User } from '../types';
import {
  LogOut,
  ShieldCheck,
  UserCheck,
  Layers,
  Building2,
  ChevronDown,
  KeyRound,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenChangePassword: () => void;
  onOpenEditProfile?: () => void;
  onSwitchToCustomerPortal?: () => void;
  onSwitchToAdminPortal?: () => void;
  isCustomerView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  users,
  onSwitchUser,
  onOpenChangePassword,
  onOpenEditProfile,
  onSwitchToCustomerPortal,
  onSwitchToAdminPortal,
  isCustomerView,
}) => {
  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'head':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Head (Administrator)
          </span>
        );
      case 'regional_incharge':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5" />
            Regional Incharge
          </span>
        );
      case 'area_incharge':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <UserCheck className="w-3.5 h-3.5" />
            Area Incharge
          </span>
        );
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <UserCheck className="w-3.5 h-3.5" />
            Customer / Investor
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Windows-style brand bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                  Mutual fund (SIF) and NPS scheme return calculating site
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mutual Fund (SIF) & NPS Return Calculation & Administration Portal
              </p>
            </div>
          </div>

          {/* Quick Dual App Links / External Sub-Domain Reference */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser?.role === 'customer' ? null : isCustomerView ? (
              <button
                type="button"
                onClick={onSwitchToAdminPortal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Switch to Staff Admin Portal"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin Portal</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSwitchToCustomerPortal}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open Customer Web Portal"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Web Portal</span>
                </button>
              </div>
            )}
          </div>

          {/* Current User Info & Actions */}
          {currentUser && (
            <div className="flex items-center gap-4">
              {/* User Identity Dossier */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900 flex items-center justify-end gap-2">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentUser.designation}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  {getRoleBadge(currentUser.role)}
                </div>

                {/* Head Profile Edit Button - Exclusive Feature for Head */}
                {currentUser.role === 'head' && onOpenEditProfile && (
                  <button
                    onClick={onOpenEditProfile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    title="Update Head Profile Details"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Head Profile</span>
                  </button>
                )}

                {/* Change Password Button - Accessible to all incharges */}
                <button
                  onClick={onOpenChangePassword}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Change your account password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Change Password</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors ml-1"
                  title="Sign out of system"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

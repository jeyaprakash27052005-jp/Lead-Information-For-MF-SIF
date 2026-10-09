import React from 'react';
import { User, ViewTab } from '../types';
import {
  Users,
  UserPlus,
  PlusCircle,
  Activity,
  BarChart3,
  FileSpreadsheet,
  FolderOpen,
  TrendingUp,
  Shield,
  Layers,
  Globe
} from 'lucide-react';

interface NavigationProps {
  currentUser: User;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  leadsCount: number;
  assignedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  leadsCount,
  assignedCount,
}) => {
  const isHead = currentUser.role === 'head';
  const isRegional = currentUser.role === 'regional_incharge';
  const isArea = currentUser.role === 'area_incharge';
  const isCustomer = currentUser.role === 'customer';

  interface NavItem {
    id: ViewTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    highlight?: boolean;
    description: string;
  }

  const items: NavItem[] = [];

  if (isCustomer) {
    // Dedicated customer nav tabs
    items.push({
      id: 'customer-portal',
      label: 'My Application & Status',
      icon: <Globe className="w-4 h-4" />,
      description: 'View your investor dossier, lead status, and assigned regional officer',
    });

    items.push({
      id: 'mf-calculator',
      label: 'MF Return Calculator',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Calculate SIP and lumpsum compounding returns for mutual fund schemes',
    });

    items.push({
      id: 'nps-calculator',
      label: 'NPS Pension Calculator',
      icon: <Shield className="w-4 h-4" />,
      description: 'Simulate NPS retirement corpus, pension payouts, and 80CCD tax benefits',
    });

    items.push({
      id: 'scheme-management',
      label: 'Browse Schemes Catalog',
      icon: <Layers className="w-4 h-4" />,
      description: 'Explore available mutual fund and NPS investment schemes',
    });
  } else {
    // All Leads - "the all user lead will show all user"
    items.push({
      id: 'all-leads',
      label: 'All Leads Directory',
      icon: <FolderOpen className="w-4 h-4" />,
      badge: leadsCount,
      description: 'Universal directory of all leads across organization',
    });

    // Assigned Leads - for Regional Incharge and Area Incharge
    if (isRegional || isArea) {
      items.push({
        id: 'assigned-leads',
        label: isRegional ? 'Assigned Regional Leads' : 'My Assigned Leads',
        icon: <Users className="w-4 h-4" />,
        badge: assignedCount,
        highlight: true,
        description: isRegional ? 'Leads assigned to your division' : 'Your portfolio leads',
      });
    }

    // Feature: Add Leads (Head & Area Incharge)
    if (isHead || isArea) {
      items.push({
        id: 'add-lead',
        label: 'Add New Lead',
        icon: <PlusCircle className="w-4 h-4" />,
        description: 'Record new lead with financial profile and savings narration',
      });
    }

    // Feature: Lead Status (Head, Regional Incharge, Area Incharge)
    items.push({
      id: 'lead-status-pipeline',
      label: 'Lead Status Pipeline',
      icon: <Activity className="w-4 h-4" />,
      description: 'Track progression, status remarks, and audit added by info',
    });

    // Feature: Schemes Management (Add / Edit / Delete catalog for customer calculators)
    items.push({
      id: 'scheme-management',
      label: 'Schemes Management',
      icon: <Layers className="w-4 h-4" />,
      description: 'Add, update, or delete Mutual Fund & NPS schemes catalog',
    });

    // Feature: Regional Performance Metrics (Head & Regional Incharge)
    if (isHead || isRegional) {
      items.push({
        id: 'regional-metrics',
        label: 'Regional Metrics',
        icon: <BarChart3 className="w-4 h-4" />,
        description: 'Regional performance KPIs, conversion rates, and volume',
      });
    }

    // Feature: Overall Lead Reports & Downloads (Status-wise and Regional-wise)
    items.push({
      id: 'lead-reports',
      label: 'Overall Lead Reports',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      description: 'Download formats segregated by status-wise and regional-wise criteria',
    });

    // Feature: Users Add / Manage (Head & Regional Incharge)
    if (isHead || isRegional) {
      items.push({
        id: 'user-management',
        label: isHead ? 'User Management' : 'Area Incharge Roster',
        icon: <UserPlus className="w-4 h-4" />,
        description: isHead
          ? 'Create Regional & Area Incharges, delete or deactivate users'
          : 'Manage team incharge IDs, deactivate or delete',
      });
    }

    // Feature: Customer Web Portal (Sub-Domain MF-SIF-investment-calculator.vercel.app)
    items.push({
      id: 'customer-portal',
      label: 'Customer Web Portal',
      icon: <Globe className="w-4 h-4" />,
      description: 'Open Customer Sub-Domain Portal (MF-SIF-investment-calculator.vercel.app)',
    });
  }

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-thin">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={item.description}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                      isActive
                        ? 'bg-slate-700 text-indigo-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

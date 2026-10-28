import React from 'react';
import { HamburgerMenu } from './HamburgerMenu';
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
  Globe,
  Image as ImageIcon,
  Megaphone,
  HeartPulse,
  ToggleRight,
  ListChecks,
  Calculator,
  Landmark,
  LayoutList,
} from 'lucide-react';

interface NavigationProps {
  currentUser: User;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  leadsCount: number;
  assignedCount: number;
  /** false in the stand-alone Admin portal, which has no link to the customer site */
  allowCustomerPortal?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  leadsCount,
  assignedCount,
  allowCustomerPortal = true,
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

    // Feature: Add Leads (Head, Regional Incharge & Area Incharge)
    if (isHead || isRegional || isArea) {
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

    // Feature: Finance Health Check-up reports (Head & Regional Incharge)
    if (isHead || isRegional) {
      items.push({
        id: 'health-reports',
        label: 'Health Check-up Reports',
        icon: <HeartPulse className="w-4 h-4" />,
        description: 'Everyone who took the Finance Health Check-up, with scores, contact details and PDF reports',
      });
    }

    // Feature: Health check-up questions and site-wide feature switches (Head & Regional Incharge only)
    if (isHead || isRegional) {
      items.push({
        id: 'health-questions',
        label: 'Health Check-up Questions',
        icon: <ListChecks className="w-4 h-4" />,
        description: 'Add, edit and remove the questions asked in the Finance Health Check-up',
      });
      items.push({
        id: 'feature-controls',
        label: 'Feature Controls',
        icon: <ToggleRight className="w-4 h-4" />,
        description: 'Switch portals and features on or off, set the calculator return rates, check e-mail setup',
      });
    }

    // Feature: Awareness programmes (Head, Regional Incharge and Area Incharge)
    if (isHead || isRegional || isArea) {
      items.push({
        id: 'awareness-admin',
        label: 'Awareness Programs',
        icon: <Megaphone className="w-4 h-4" />,
        description: isArea ? 'Add awareness programmes for your division' : 'Add awareness programme details that customers see',
      });
    }

    // Feature: Mutual fund advertisements (added by the admin team only)
    if (isHead || isRegional || isArea) {
      items.push({
        id: 'fund-ads-admin',
        label: 'Mutual Fund Ads',
        icon: <Landmark className="w-4 h-4" />,
        description: 'Add, edit and delete the mutual fund advertisements customers see',
      });
    }

    // Feature: Advertising website menus and pages (Head and Regional Incharge only)
    if (isHead || isRegional) {
      items.push({
        id: 'site-content',
        label: 'Website Menus',
        icon: <LayoutList className="w-4 h-4" />,
        description: 'Add, edit and delete the menus, investment guide and promotion pages of the advertising website',
      });
    }

    // Feature: Home Screen Ads and animated creatives (Head, Regional Incharge and Area Incharge)
    if (isHead || isRegional || isArea) {
      items.push({
        id: 'ads-management',
        label: 'Home Screen Ads',
        icon: <ImageIcon className="w-4 h-4" />,
        description: 'Create animated ad creatives and manage the moving ads shown on the Home Screen',
      });
    }

    // Feature: Investment calculations: lumpsum and SIP future value, growth, dividend (Head, Regional and Area Incharge only)
    if (isHead || isRegional || isArea) {
      items.push({
        id: 'finance-calculations',
        label: 'Investment Calculations',
        icon: <Calculator className="w-4 h-4" />,
        description: 'Lumpsum and SIP future value, growth value and dividend calculations',
      });
    }

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

    // Feature: Customer Web Portal
    if (allowCustomerPortal) {
      items.push({
        id: 'customer-portal',
        label: 'Customer Web Portal',
        icon: <Globe className="w-4 h-4" />,
        description: 'Open the Customer Web Portal',
      });
    }
  }

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <HamburgerMenu items={items} activeId={activeTab} onSelect={onTabChange} title="Menu" />
      </div>
    </nav>
  );
};

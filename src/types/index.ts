export type UserRole = 'head' | 'regional_incharge' | 'area_incharge' | 'customer';

export interface User {
  id: string;
  username: string;
  name: string;
  designation: string;
  role: UserRole;
  region: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  associatedLeadId?: string;
}

export type SchemeType = 'mutual_fund' | 'nps';

export interface InvestmentScheme {
  id: string;
  name: string;
  type: SchemeType;
  category: string;
  expectedReturnRate: number;
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Very High';
  minInvestment?: number;
  description?: string;
  fundHouse?: string;
  createdAt?: string;
}

export type LeadStatus =
  | 'Pending'
  | 'Ready to Invest'
  | 'Process'
  | 'Other';

export interface Lead {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  annualIncome: number;
  occupation: string;
  narration?: string;
  mobile?: string;
  panAvailable?: boolean;
  panNumber?: string;
  dematAvailable?: boolean;
  kycComplete?: boolean;
  sipAutopayActive?: boolean;
  status: LeadStatus;
  statusRemarks?: string;
  otherStatusNarration?: string;
  addedByUserId: string;
  addedByName: string;
  addedByDesignation: string;
  assignedRegion: string;
  assignedTeamMember?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewTab =
  | 'all-leads'
  | 'assigned-leads'
  | 'add-lead'
  | 'lead-status-pipeline'
  | 'user-management'
  | 'regional-metrics'
  | 'lead-reports'
  | 'mf-calculator'
  | 'nps-calculator'
  | 'scheme-management'
  | 'customer-portal';

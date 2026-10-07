export type UserRole = 'head' | 'regional_incharge' | 'area_incharge';

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
  narration: string;
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
  | 'lead-reports';

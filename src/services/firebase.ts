import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Lead, LeadStatus } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

// Initial default users and leads seed data for online Firestore
interface StoredUser extends User {
  password?: string;
}

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr_head_1',
    username: 'JPM_MF',
    password: 'JPM_MF',
    name: 'JPM MF (Head Incharge)',
    designation: 'Head Incharge',
    role: 'head',
    region: 'Universal HQ',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'System Superadmin',
  },
  {
    id: 'usr_reg_north',
    username: 'reg_north',
    password: 'password123',
    name: 'Sophia Martinez',
    designation: 'Regional Incharge - North Division',
    role: 'regional_incharge',
    region: 'North Division',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'JPM_MF',
  },
  {
    id: 'usr_reg_south',
    username: 'reg_south',
    password: 'password123',
    name: 'David Vikram Rao',
    designation: 'Regional Incharge - South Division',
    role: 'regional_incharge',
    region: 'South Division',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'JPM_MF',
  },
  {
    id: 'usr_area_1',
    username: 'area_north1',
    password: 'password123',
    name: 'Liam Chen',
    designation: 'Area Incharge - Metro Sector A',
    role: 'area_incharge',
    region: 'North Division',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'JPM_MF',
  },
  {
    id: 'usr_area_2',
    username: 'area_south1',
    password: 'password123',
    name: 'Priya Sharma',
    designation: 'Area Incharge - Coastal Belt',
    role: 'area_incharge',
    region: 'South Division',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'JPM_MF',
  },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead_101',
    name: 'Jonathan Miller',
    age: 42,
    gender: 'Male',
    annualIncome: 1450000,
    occupation: 'Senior Solutions Architect',
    narration: 'Has ₹4,50,000 in diversified equity mutual funds, ₹3,00,000 in EPF/PPF retirement savings, seeking tax-saving long term wealth plan.',
    status: 'Ready to Invest',
    statusRemarks: 'Discussed risk appetite and tax bracket. Highly responsive to premium wealth plan.',
    addedByUserId: 'usr_area_1',
    addedByName: 'Liam Chen',
    addedByDesignation: 'Area Incharge - Metro Sector A',
    assignedRegion: 'North Division',
    assignedTeamMember: 'Liam Chen',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'lead_102',
    name: 'Elena Rostova',
    age: 36,
    gender: 'Female',
    annualIncome: 1900000,
    occupation: 'Cardiothoracic Surgeon',
    narration: 'Holds ₹12,00,000 in fixed deposit treasury bonds and commercial real estate funds. Interested in comprehensive child education endowment.',
    status: 'Process',
    statusRemarks: 'Tailored proposal sent. Undergoing documentation review.',
    addedByUserId: 'usr_reg_north',
    addedByName: 'Sophia Martinez',
    addedByDesignation: 'Regional Incharge - North Division',
    assignedRegion: 'North Division',
    assignedTeamMember: 'Liam Chen',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'lead_103',
    name: 'Karthik Subramanian',
    age: 29,
    gender: 'Male',
    annualIncome: 980000,
    occupation: 'Lead Product Designer',
    narration: 'Currently has systematic investment plan (SIP) of ₹12,000/mo and gold ETF holdings (₹1,80,000). Wants term insurance and retirement fund.',
    status: 'Ready to Invest',
    statusRemarks: 'Successfully closed premium plan. Initial deposit verified and policy generated.',
    addedByUserId: 'usr_area_2',
    addedByName: 'Priya Sharma',
    addedByDesignation: 'Area Incharge - Coastal Belt',
    assignedRegion: 'South Division',
    assignedTeamMember: 'Priya Sharma',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'lead_104',
    name: 'Amara Okafor',
    age: 48,
    gender: 'Female',
    annualIncome: 2200000,
    occupation: 'Business Enterprise Owner (Logistics)',
    narration: 'Retains business surplus in liquid debt funds (₹25,00,000) and commercial land reserves. Needs keyman insurance and corporate tax shield.',
    status: 'Pending',
    statusRemarks: 'Initial phone consultation completed. Scheduled in-person executive review next Tuesday.',
    addedByUserId: 'usr_head_1',
    addedByName: 'JPM MF (Head Incharge)',
    addedByDesignation: 'Head Incharge',
    assignedRegion: 'South Division',
    assignedTeamMember: 'David Vikram Rao',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'lead_105',
    name: 'Gabriel Morales',
    age: 33,
    gender: 'Male',
    annualIncome: 820000,
    occupation: 'Renewable Energy Consultant',
    narration: 'High-yield savings account holding ₹2,50,000 emergency fund. Looking for green energy bond investments and health coverage.',
    status: 'Other',
    otherStatusNarration: 'Client currently waiting for annual bonus payout in November before initiating investment allocation.',
    statusRemarks: 'Consultation completed; scheduled follow-up on bonus cycle.',
    addedByUserId: 'usr_area_1',
    addedByName: 'Liam Chen',
    addedByDesignation: 'Area Incharge - Metro Sector A',
    assignedRegion: 'North Division',
    assignedTeamMember: 'Liam Chen',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

let isInitialized = false;

export async function ensureFirestoreDatabaseSeeded(): Promise<void> {
  if (isInitialized) return;
  const usersPath = 'users';
  try {
    const headDocRef = doc(db, usersPath, 'usr_head_1');
    const headSnap = await getDoc(headDocRef);
    if (!headSnap.exists()) {
      // Seed initial users into Firestore
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, usersPath, u.id), u);
      }
    }

    const leadsPath = 'leads';
    const leadsSnap = await getDocs(collection(db, leadsPath));
    if (leadsSnap.empty) {
      for (const l of INITIAL_LEADS) {
        await setDoc(doc(db, leadsPath, l.id), l);
      }
    }
    isInitialized = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, usersPath);
  }
}

export const firebaseDbService = {
  async login(username: string, password?: string): Promise<{ user: User }> {
    await ensureFirestoreDatabaseSeeded();
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const users: StoredUser[] = [];
      snap.forEach((d) => {
        users.push(d.data() as StoredUser);
      });

      const user = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!user) {
        throw new Error('User not found. Please contact the Head of Operations.');
      }

      if (user.status === 'inactive') {
        throw new Error('This account has been deactivated. Please contact your administrator.');
      }

      if (password && user.password && user.password !== password) {
        throw new Error('Invalid password. Please check your credentials.');
      }

      const { password: _p, ...safeUser } = user;
      return { user: safeUser as User };
    } catch (error) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('deactivated') || error.message.includes('password'))) {
        throw error;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getUsers(): Promise<User[]> {
    await ensureFirestoreDatabaseSeeded();
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const users: User[] = [];
      snap.forEach((d) => {
        const data = d.data() as StoredUser;
        const { password: _p, ...safeUser } = data;
        users.push(safeUser as User);
      });
      return users;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createUser(userData: {
    username: string;
    password?: string;
    name: string;
    designation: string;
    role: User['role'];
    region: string;
    createdBy: string;
    creatorRole: string;
  }): Promise<User> {
    await ensureFirestoreDatabaseSeeded();
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      let exists = false;
      snap.forEach((d) => {
        const u = d.data() as StoredUser;
        if (u.username.toLowerCase() === userData.username.trim().toLowerCase()) {
          exists = true;
        }
      });

      if (exists) {
        throw new Error(`Username "${userData.username}" is already assigned to an existing user.`);
      }

      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser: StoredUser = {
        id: newId,
        username: userData.username.trim(),
        password: userData.password?.trim() || userData.username.trim(),
        name: userData.name.trim(),
        designation: userData.designation.trim(),
        role: userData.role,
        region: userData.region.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: userData.createdBy || 'Head Incharge',
      };

      await setDoc(doc(db, path, newId), newUser);
      const { password: _p, ...safeUser } = newUser;
      return safeUser as User;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already assigned')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<User> {
    await ensureFirestoreDatabaseSeeded();
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        throw new Error('User not found in online database');
      }

      await updateDoc(userRef, { status });
      const updatedSnap = await getDoc(userRef);
      const data = updatedSnap.data() as StoredUser;
      const { password: _p, ...safeUser } = data;
      return safeUser as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateUserProfile(
    userId: string,
    profileData: {
      name: string;
      designation: string;
      region: string;
      username: string;
      role?: User['role'];
    }
  ): Promise<User> {
    await ensureFirestoreDatabaseSeeded();
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        throw new Error('User not found in online database');
      }

      const updates: Partial<StoredUser> = {
        name: profileData.name.trim(),
        designation: profileData.designation.trim(),
        region: profileData.region.trim(),
        username: profileData.username.trim(),
      };
      if (profileData.role) {
        updates.role = profileData.role;
      }

      await updateDoc(userRef, updates);
      const updatedSnap = await getDoc(userRef);
      const data = updatedSnap.data() as StoredUser;
      const { password: _p, ...safeUser } = data;
      return safeUser as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    await ensureFirestoreDatabaseSeeded();
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        throw new Error('User not found');
      }

      const data = snap.data() as StoredUser;
      if (data.password && data.password !== currentPassword) {
        throw new Error('Current password does not match.');
      }

      await updateDoc(userRef, { password: newPassword });
      return { success: true, message: 'Password updated successfully in online database' };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Current password')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    await ensureFirestoreDatabaseSeeded();
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getLeads(): Promise<Lead[]> {
    await ensureFirestoreDatabaseSeeded();
    const path = 'leads';
    try {
      const snap = await getDocs(collection(db, path));
      const leads: Lead[] = [];
      snap.forEach((d) => {
        leads.push(d.data() as Lead);
      });
      // Sort newest first
      leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return leads;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    await ensureFirestoreDatabaseSeeded();
    const path = 'leads';
    try {
      const newId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newLead: Lead = {
        ...leadData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, path, newId), newLead);
      return newLead;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    await ensureFirestoreDatabaseSeeded();
    const path = `leads/${id}`;
    try {
      const leadRef = doc(db, 'leads', id);
      const snap = await getDoc(leadRef);
      if (!snap.exists()) {
        throw new Error('Lead not found in online database');
      }

      const existing = snap.data() as Lead;
      const updated: Lead = {
        ...existing,
        ...leadData,
        id: existing.id,
        addedByUserId: existing.addedByUserId,
        addedByName: existing.addedByName,
        addedByDesignation: existing.addedByDesignation,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(leadRef, updated as Record<string, any>);
      return updated;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async updateLeadStatus(
    id: string,
    status: LeadStatus,
    statusRemarks?: string,
    otherStatusNarration?: string
  ): Promise<Lead> {
    await ensureFirestoreDatabaseSeeded();
    const path = `leads/${id}`;
    try {
      const leadRef = doc(db, 'leads', id);
      const snap = await getDoc(leadRef);
      if (!snap.exists()) {
        throw new Error('Lead not found in online database');
      }

      const existing = snap.data() as Lead;
      const updates: Partial<Lead> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (statusRemarks !== undefined) {
        updates.statusRemarks = statusRemarks;
      }
      if (otherStatusNarration !== undefined) {
        updates.otherStatusNarration = otherStatusNarration;
      }

      await updateDoc(leadRef, updates as Record<string, any>);
      return {
        ...existing,
        ...updates,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteLead(id: string): Promise<void> {
    await ensureFirestoreDatabaseSeeded();
    const path = `leads/${id}`;
    try {
      await deleteDoc(doc(db, 'leads', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async resetData(): Promise<void> {
    const usersPath = 'users';
    const leadsPath = 'leads';
    try {
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, usersPath, u.id), u);
      }
      for (const l of INITIAL_LEADS) {
        await setDoc(doc(db, leadsPath, l.id), l);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset');
    }
  },
};

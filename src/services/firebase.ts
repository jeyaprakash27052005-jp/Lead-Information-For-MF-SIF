import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  deleteField,
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
import { DEFAULT_REGIONS } from '../utils/regions';
import { normalizeIndianMobile, isValidPan } from '../utils/validation';

const REGIONS_COLLECTION = 'regions';
const regionDocId = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'region';

const isPermissionError = (e: unknown) => {
  const text = e instanceof Error ? e.message : String(e);
  return /permission/i.test(text) || (e as { code?: string })?.code === 'permission-denied';
};

// Marker so the default regions are written to the 'regions' table only once
// (afterwards, deleting every region keeps it empty).
const seedMarkerRef = () => doc(db, 'test', 'regions_seeded');
const regionsTableSeeded = async () => (await getDoc(seedMarkerRef())).exists();
const markRegionsTableSeeded = async () => {
  try {
    await setDoc(seedMarkerRef(), { seededAt: new Date().toISOString() });
  } catch {
    /* marker is best-effort */
  }
};

// Fallback storage (one document) used only while the 'regions' table is not permitted
const legacyRef = () => doc(db, 'test', 'regions_config');
const readLegacy = async (): Promise<string[]> => {
  const snap = await getDoc(legacyRef());
  const names = snap.exists() ? (snap.data() as { names?: unknown }).names : undefined;
  return Array.isArray(names)
    ? names.filter((n): n is string => typeof n === 'string' && n.trim() !== '')
    : [...DEFAULT_REGIONS];
};
const legacyRegions = {
  async get(): Promise<string[]> {
    try {
      const names = await readLegacy();
      const snap = await getDoc(legacyRef());
      if (!snap.exists()) await setDoc(legacyRef(), { names });
      return names;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'test/regions_config');
    }
  },
  async add(name: string): Promise<string> {
    try {
      const current = await readLegacy();
      if (current.some((r) => r.toLowerCase() === name.toLowerCase())) {
        throw new Error(`Region "${name}" already exists.`);
      }
      await setDoc(legacyRef(), { names: [...current, name] });
      return name;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) throw error;
      handleFirestoreError(error, OperationType.WRITE, 'test/regions_config');
    }
  },
  async remove(name: string): Promise<void> {
    try {
      const current = await readLegacy();
      await setDoc(legacyRef(), { names: current.filter((r) => r.toLowerCase() !== name.toLowerCase()) });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'test/regions_config');
    }
  },
};

const app = initializeApp(firebaseConfig);
// Firestore rejects fields whose value is `undefined` (e.g. an optional narration that was not
// filled in). Ignore them instead of failing the save.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId);
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

interface StoredUser extends User {
  password?: string;
}

// Only the Head login is created, and only when the online database has no Head account yet
// (a brand-new database). All other users, leads and regions live in the online Firestore.
const HEAD_BOOTSTRAP_USER: StoredUser = {
  id: 'usr_head_1',
  username: 'JPM_MF',
  password: 'JPM_MF',
  name: 'JPM MF (Head Incharge)',
  designation: 'Head Incharge',
  role: 'head',
  region: 'All Regions (National HQ)',
  status: 'active',
  createdAt: new Date().toISOString(),
  createdBy: 'System Superadmin',
};

let isInitialized = false;

export async function ensureFirestoreDatabaseSeeded(): Promise<void> {
  if (isInitialized) return;
  const usersPath = 'users';
  try {
    // The Head account is created ONLY in a brand-new database. Nothing else is ever
    // re-created, so anything deleted in the app stays deleted.
    const headDocRef = doc(db, usersPath, 'usr_head_1');
    const headSnap = await getDoc(headDocRef);
    if (!headSnap.exists()) {
      await setDoc(doc(db, usersPath, HEAD_BOOTSTRAP_USER.id), HEAD_BOOTSTRAP_USER);
    }
    isInitialized = true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, usersPath);
  }
}

// Checks the mobile number (valid Indian number, not used by any other lead) and the PAN.
// Returns the cleaned values to store. Throws a plain Error with a readable message.
async function validateLeadContact(
  data: Partial<Lead>,
  excludeLeadId?: string
): Promise<Partial<Lead>> {
  const out: Partial<Lead> = {};
  if (data.mobile !== undefined) {
    const mobile = normalizeIndianMobile(data.mobile);
    if (!mobile) {
      throw new Error('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8 or 9).');
    }
    let snap;
    try {
      snap = await getDocs(collection(db, 'leads'));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    }
    let owner: string | null = null;
    snap!.forEach((d) => {
      const l = d.data() as Lead;
      if (l.mobile === mobile && d.id !== excludeLeadId) owner = l.name;
    });
    if (owner) {
      throw new Error(`Mobile number ${mobile} is already registered for lead "${owner}". Each mobile number can belong to only one lead.`);
    }
    out.mobile = mobile;
  }
  if (data.panAvailable) {
    const pan = (data.panNumber || '').trim().toUpperCase();
    if (!isValidPan(pan)) {
      throw new Error('PAN is marked Available. Please enter a valid PAN number (format: ABCDE1234F).');
    }
    out.panNumber = pan;
  } else if (data.panAvailable === false) {
    out.panNumber = undefined;
  }
  return out;
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

  // ---- Regions (managed by Head) ----
  // Each region is its own document in the 'regions' collection (its own table).
  // If the live Firestore rules do not allow that collection yet, the same list is kept in
  // one document in the already-permitted 'test' collection so the feature still works.
  async getRegions(): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, REGIONS_COLLECTION));
      const names: string[] = [];
      snap.forEach((d) => {
        const n = (d.data() as { name?: unknown }).name;
        if (typeof n === 'string' && n.trim()) names.push(n.trim());
      });
      if (names.length === 0 && !(await regionsTableSeeded())) {
        for (const n of DEFAULT_REGIONS) {
          await setDoc(doc(db, REGIONS_COLLECTION, regionDocId(n)), { name: n, createdAt: new Date().toISOString() });
        }
        await markRegionsTableSeeded();
        return [...DEFAULT_REGIONS];
      }
      return names;
    } catch (error) {
      if (!isPermissionError(error)) handleFirestoreError(error, OperationType.LIST, REGIONS_COLLECTION);
      return legacyRegions.get();
    }
  },

  async createRegion(name: string): Promise<string> {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) throw new Error('Please enter a region name.');
    try {
      const ref = doc(db, REGIONS_COLLECTION, regionDocId(clean));
      if ((await getDoc(ref)).exists()) throw new Error(`Region "${clean}" already exists.`);
      await setDoc(ref, { name: clean, createdAt: new Date().toISOString() });
      return clean;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) throw error;
      if (!isPermissionError(error)) handleFirestoreError(error, OperationType.CREATE, REGIONS_COLLECTION);
      return legacyRegions.add(clean);
    }
  },

  async deleteRegion(name: string): Promise<void> {
    try {
      await deleteDoc(doc(db, REGIONS_COLLECTION, regionDocId(name)));
    } catch (error) {
      if (!isPermissionError(error)) handleFirestoreError(error, OperationType.DELETE, REGIONS_COLLECTION);
      await legacyRegions.remove(name);
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
    // Validation errors are thrown as-is (not wrapped) so the form can show them
    leadData = { ...leadData, ...(await validateLeadContact(leadData)) };
    try {
      const newId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newLead = {
        ...leadData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      } as Lead;
      (Object.keys(newLead) as (keyof Lead)[]).forEach((k) => {
        if (newLead[k] === undefined) delete newLead[k];
      });

      await setDoc(doc(db, path, newId), newLead);
      return newLead;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    await ensureFirestoreDatabaseSeeded();
    const path = `leads/${id}`;
    if (leadData.mobile !== undefined || leadData.panAvailable !== undefined) {
      leadData = { ...leadData, ...(await validateLeadContact(leadData, id)) };
    }
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

      (Object.keys(updated) as (keyof Lead)[]).forEach((k) => {
        if (updated[k] === undefined) delete updated[k];
      });
      const payload: Record<string, any> = { ...updated };
      if (!updated.panAvailable) {
        // no PAN on record: remove any old number
        delete updated.panNumber;
        payload.panNumber = deleteField();
      }
      if (updated.status !== 'Other') {
        // narration only applies to the "Other" status: remove any old one
        delete updated.otherStatusNarration;
        payload.otherStatusNarration = deleteField();
      }
      await updateDoc(leadRef, payload);
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

      const payload: Record<string, any> = { ...updates };
      const result: Lead = { ...existing, ...updates };
      if (status !== 'Other') {
        // narration only applies to the "Other" status: remove any old one
        payload.otherStatusNarration = deleteField();
        delete result.otherStatusNarration;
      }
      await updateDoc(leadRef, payload);
      return result;
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
};

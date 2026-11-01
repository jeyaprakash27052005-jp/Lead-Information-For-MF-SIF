import { QueryMessage, SiteCustomer, SiteQuery } from '../types';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where, arrayUnion } from 'firebase/firestore';
import { customerIdFor, hashSecret, isEmail, newVerificationCode, normalizeCode, randomSalt } from '../utils/siteAuth';
import { normalizeIndianMobile } from '../utils/validation';
import { NATIONAL_HQ_REGION } from '../utils/regions';
import { Lead } from '../types';

const MAX_ATTEMPTS = 5;
const CODE_HOURS = 48;
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

type Stored = SiteCustomer & { passwordHash: string; passwordSalt: string; verifyHash?: string; verifySalt?: string; verifyExpires?: string; verifyAttempts?: number };

const publicView = (s: Stored): SiteCustomer => ({
  id: s.id,
  fullName: s.fullName,
  mobile: s.mobile,
  email: s.email,
  verified: !!s.verified,
  createdAt: s.createdAt,
  verifiedAt: s.verifiedAt,
  codePending: !!s.verifyHash && !!s.verifyExpires && new Date(s.verifyExpires).getTime() > Date.now(),
  codeExpires: s.verifyExpires,
});
const dbErr = (what: string) => new Error(`Could not ${what}. Check your connection and that the Firestore rules allow "siteCustomers" and "siteQueries".`);

/** Accounts and questions of the advertising website: no outside e-mail / SMS service is used. */
export const siteCustomerStorage = {
  async register(input: { fullName: string; mobile: string; email: string; password: string; confirm: string }): Promise<SiteCustomer> {
    const fullName = input.fullName.trim().replace(/\s+/g, ' ');
    const email = input.email.trim().toLowerCase();
    const mobile = normalizeIndianMobile(input.mobile);
    if (fullName.length < 2) throw new Error('Type your full name.');
    if (!mobile) throw new Error('Type a valid 10 digit mobile number.');
    if (!isEmail(email)) throw new Error('Type a valid e-mail ID.');
    if (input.password.length < 8) throw new Error('The password needs at least 8 characters.');
    if (input.password !== input.confirm) throw new Error('The password and confirm password do not match.');
    const id = await customerIdFor(email);
    try {
      if ((await getDoc(doc(db, 'siteCustomers', id))).exists()) throw new Error('This e-mail ID is already registered. Please log in.');
      const salt = randomSalt();
      const c: Stored = { id, fullName, mobile, email, verified: false, createdAt: new Date().toISOString(), passwordSalt: salt, passwordHash: await hashSecret(input.password, salt) };
      await setDoc(doc(db, 'siteCustomers', id), clean(c));
      // Also keep the new customer in the All Leads Directory, as a separate entry (never blocks sign-up)
      try {
        const now = new Date().toISOString();
        const lead: Lead = {
          id: `lead_ads_${id}`,
          name: fullName,
          age: 0,
          gender: 'Other',
          annualIncome: 0,
          occupation: 'Not provided',
          mobile,
          email,
          narration: 'Created an account on the advertising website.',
          status: 'Pending',
          addedByUserId: 'ads_website',
          addedByName: 'Advertising Website',
          addedByDesignation: 'Website customer',
          assignedRegion: NATIONAL_HQ_REGION,
          leadSource: 'ads_website',
          createdAt: now,
          updatedAt: now,
        } as Lead;
        await setDoc(doc(db, 'leads', lead.id), clean(lead));
      } catch (_e) {
        /* the account is already created; the lead can be added by the team */
      }
      return publicView(c);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('This e-mail')) throw e;
      throw dbErr('create the account');
    }
  },

  async login(identifier: string, password: string): Promise<SiteCustomer> {
    const idf = identifier.trim();
    if (!idf || !password) throw new Error('Type your e-mail ID (or mobile number) and password.');
    let stored: Stored | null = null;
    try {
      if (idf.includes('@')) {
        const snap = await getDoc(doc(db, 'siteCustomers', await customerIdFor(idf)));
        stored = snap.exists() ? (snap.data() as Stored) : null;
      } else {
        const m = normalizeIndianMobile(idf);
        if (m) {
          const res = await getDocs(query(collection(db, 'siteCustomers'), where('mobile', '==', m)));
          res.forEach((d) => {
            if (!stored) stored = d.data() as Stored;
          });
        }
      }
    } catch (_e) {
      throw dbErr('log in');
    }
    const s = stored as Stored | null;
    if (!s || (await hashSecret(password, s.passwordSalt)) !== s.passwordHash) throw new Error('The e-mail ID / mobile number or password is not correct.');
    return publicView(s);
  },

  async get(id: string): Promise<SiteCustomer | null> {
    const snap = await getDoc(doc(db, 'siteCustomers', id));
    return snap.exists() ? publicView(snap.data() as Stored) : null;
  },

  /** The customer types the code that the team gave on a call / message */
  async verifyWithCode(id: string, code: string): Promise<SiteCustomer> {
    const ref = doc(db, 'siteCustomers', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Account not found.');
    const s = snap.data() as Stored;
    if (s.verified) return publicView(s);
    if (!s.verifyHash || !s.verifySalt) throw new Error('No verification code has been given to you yet. Our team will contact you on your mobile number.');
    if (!s.verifyExpires || new Date(s.verifyExpires).getTime() < Date.now()) throw new Error('This code has expired. Please ask our team for a new code.');
    if ((s.verifyAttempts ?? 0) >= MAX_ATTEMPTS) throw new Error('Too many wrong attempts. Please ask our team for a new code.');
    if ((await hashSecret(normalizeCode(code), s.verifySalt)) !== s.verifyHash) {
      await updateDoc(ref, { verifyAttempts: (s.verifyAttempts ?? 0) + 1 });
      throw new Error(`The code is not correct. ${MAX_ATTEMPTS - (s.verifyAttempts ?? 0) - 1} attempts left.`);
    }
    await updateDoc(ref, { verified: true, verifiedAt: new Date().toISOString(), verifyHash: '', verifySalt: '', verifyExpires: '', verifyAttempts: 0 });
    return publicView({ ...s, verified: true, verifiedAt: new Date().toISOString(), verifyHash: '' });
  },

  /** The customer typed the code shown on the page (it is generated in the browser, valid for 30 seconds) */
  async markSelfVerified(id: string): Promise<SiteCustomer> {
    try {
      const ref = doc(db, 'siteCustomers', id);
      await updateDoc(ref, { verified: true, verifiedAt: new Date().toISOString(), verifyHash: '', verifySalt: '', verifyExpires: '' });
      const snap = await getDoc(ref);
      return publicView(snap.data() as Stored);
    } catch (_e) {
      throw dbErr('verify the account');
    }
  },

  // ----- staff (admin portal) -----
  async listCustomers(): Promise<SiteCustomer[]> {
    const snap = await getDocs(collection(db, 'siteCustomers'));
    const l: SiteCustomer[] = [];
    snap.forEach((d) => l.push(publicView(d.data() as Stored)));
    return l.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  /** Makes a new code valid for 48 hours. Only a salted hash is stored; the code is returned once for the staff to read out. */
  async generateCode(id: string): Promise<string> {
    const code = newVerificationCode();
    const salt = randomSalt();
    try {
      await updateDoc(doc(db, 'siteCustomers', id), {
        verifyHash: await hashSecret(normalizeCode(code), salt),
        verifySalt: salt,
        verifyExpires: new Date(Date.now() + CODE_HOURS * 3600000).toISOString(),
        verifyAttempts: 0,
      });
    } catch (_e) {
      throw dbErr('create the code');
    }
    return code;
  },
  async markVerified(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'siteCustomers', id), { verified: true, verifiedAt: new Date().toISOString(), verifyHash: '', verifySalt: '', verifyExpires: '' });
    } catch (_e) {
      throw dbErr('verify the account');
    }
  },
  async deleteCustomer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'siteCustomers', id));
    } catch (_e) {
      throw dbErr('delete the account');
    }
  },

  // ----- questions -----
  async createQuery(c: SiteCustomer, topic: string, text: string): Promise<SiteQuery> {
    const now = new Date().toISOString();
    const q: SiteQuery = {
      id: `sq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId: c.id,
      customerName: c.fullName,
      mobile: c.mobile,
      email: c.email,
      topic: topic.trim().slice(0, 200),
      messages: [{ from: 'customer', byName: c.fullName, text: text.trim().slice(0, 2000), at: now }],
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'siteQueries', q.id), clean(q));
    } catch (_e) {
      throw dbErr('send your question');
    }
    return q;
  },
  async getQueries(customerId?: string): Promise<SiteQuery[]> {
    const snap = await getDocs(customerId ? query(collection(db, 'siteQueries'), where('customerId', '==', customerId)) : collection(db, 'siteQueries'));
    const l: SiteQuery[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as SiteQuery));
    return l.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async addMessage(q: SiteQuery, m: QueryMessage): Promise<SiteQuery> {
    const next: SiteQuery = { ...q, messages: [...q.messages, m], status: m.from === 'staff' ? 'answered' : 'open', updatedAt: m.at };
    try {
      await updateDoc(doc(db, 'siteQueries', q.id), { messages: arrayUnion(clean(m)), status: next.status, updatedAt: next.updatedAt });
    } catch (_e) {
      throw dbErr('send the message');
    }
    return next;
  },
  async deleteQuery(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'siteQueries', id));
    } catch (_e) {
      throw dbErr('delete the question');
    }
  },
};

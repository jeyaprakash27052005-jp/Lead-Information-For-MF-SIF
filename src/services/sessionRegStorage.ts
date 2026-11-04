import { Lead, SessionRegistration } from '../types';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { normalizeIndianMobile } from '../utils/validation';
import { NATIONAL_HQ_REGION } from '../utils/regions';
import { isEmail } from '../utils/siteAuth';

const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
const fail = (what: string) => new Error(`Could not ${what}. Check your connection and that the Firestore rules allow "sessionRegistrations".`);

/** Registrations of the awareness sessions (one form and link per session) */
export const sessionRegStorage = {
  async register(
    program: { id: string; title: string; isPaid?: boolean; fee?: number; freeFirst?: number; maxRegistrations?: number },
    input: { attendeeType: 'customer' | 'member'; name: string; mobile: string; email: string; city: string; guests: number; note: string; paymentProof?: string; customerId?: string },
  ): Promise<SessionRegistration> {
    const name = input.name.trim().replace(/\s+/g, ' ');
    const mobile = normalizeIndianMobile(input.mobile);
    const email = input.email.trim().toLowerCase();
    if (name.length < 2) throw new Error('Type your full name.');
    if (!mobile) throw new Error('Type a valid 10 digit mobile number.');
    if (email && !isEmail(email)) throw new Error('Type a valid e-mail ID or leave it empty.');
    const guests = Math.max(0, Math.min(10, Math.floor(Number(input.guests) || 0)));
    const count = (await this.list().catch(() => [] as SessionRegistration[])).filter((r) => r.programId === program.id).length;
    if (program.maxRegistrations && count >= program.maxRegistrations) throw new Error('Registration is full. All seats are taken.');
    const free = !!program.freeFirst && count < program.freeFirst;
    const payNow = !!program.isPaid && !free;
    const amount = payNow ? program.fee ?? 0 : 0;
    if (payNow && !input.paymentProof) throw new Error('Upload the full payment screenshot first.');
    const id = `reg_${program.id}_${mobile}`;
    const now = new Date().toISOString();
    const reg: SessionRegistration = {
      id,
      cardToken: newToken(),
      programId: program.id,
      programTitle: program.title.slice(0, 200),
      attendeeType: input.attendeeType,
      name,
      mobile,
      email: email || undefined,
      city: input.city.trim() || undefined,
      guests,
      customerId: input.customerId,
      amount: program.isPaid ? amount : undefined,
      paymentProof: payNow ? input.paymentProof : undefined,
      note: input.note.trim().slice(0, 500) || undefined,
      createdAt: now,
    };
    try {
      if ((await getDoc(doc(db, 'sessionRegistrations', id))).exists()) throw new Error('This mobile number is already registered for this session.');
      await setDoc(doc(db, 'sessionRegistrations', id), clean(reg));
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('This mobile')) throw e;
      throw fail('register');
    }
    // Keep the person in the All Leads Directory as a separate entry (never blocks the registration)
    try {
      const lead = {
        id: `lead_ses_${program.id}_${mobile}`,
        name,
        age: 0,
        gender: 'Other',
        annualIncome: 0,
        occupation: 'Not provided',
        mobile,
        email: email || undefined,
        narration: `Registered as ${input.attendeeType} for the awareness session "${program.title}".${reg.city ? ` City: ${reg.city}.` : ''}`,
        status: 'Pending',
        addedByUserId: 'awareness_session',
        addedByName: 'Awareness Session Registration',
        addedByDesignation: input.attendeeType === 'member' ? 'Member' : 'Customer',
        assignedRegion: NATIONAL_HQ_REGION,
        leadSource: 'awareness_session',
        createdAt: now,
        updatedAt: now,
      } as Lead;
      await setDoc(doc(db, 'leads', lead.id), clean(lead));
    } catch (_e) {
      /* registration is saved; the lead can be added by the team */
    }
    return reg;
  },
  async list(): Promise<SessionRegistration[]> {
    try {
      const snap = await getDocs(collection(db, 'sessionRegistrations'));
      const l: SessionRegistration[] = [];
      snap.forEach((d) => l.push({ ...d.data(), id: d.id } as SessionRegistration));
      return l.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (_e) {
      throw fail('read the registrations');
    }
  },
  /** The customer types the details that go on the ID card of a completed session */
  async saveCard(id: string, card: { cardName: string; cardOccupation: string; cardCity: string; cardPhoto?: string; cardToken?: string }): Promise<string> {
    try {
      const cardToken = card.cardToken || newToken();
      await updateDoc(doc(db, 'sessionRegistrations', id), JSON.parse(JSON.stringify({ ...card, cardToken })));
      return cardToken;
    } catch (_e) {
      throw fail('save the ID card details');
    }
  },
  /** Older registrations get their QR code the first time the customer opens My Profile */
  async ensureToken(id: string): Promise<string> {
    const t = newToken();
    try {
      await updateDoc(doc(db, 'sessionRegistrations', id), { cardToken: t });
    } catch (_e) {
      throw fail('make the QR code');
    }
    return t;
  },
  /** The page opened by scanning the ID card QR code */
  async getByToken(token: string): Promise<SessionRegistration | null> {
    if (!/^[a-f0-9]{24}$/.test(token)) return null;
    try {
      const snap = await getDocs(query(collection(db, 'sessionRegistrations'), where('cardToken', '==', token)));
      let r: SessionRegistration | null = null;
      snap.forEach((d) => {
        if (!r) r = { ...d.data(), id: d.id } as SessionRegistration;
      });
      return r;
    } catch (_e) {
      throw fail('open the ID card');
    }
  },
  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sessionRegistrations', id));
    } catch (_e) {
      throw fail('delete the registration');
    }
  },
};

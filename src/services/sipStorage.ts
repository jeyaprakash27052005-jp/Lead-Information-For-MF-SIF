import { SipPlan } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

/** SIP investments entered by the admin team for leads who are Ready to Invest */
export const sipStorage = {
  async getPlans(): Promise<SipPlan[]> {
    const snap = await getDocs(collection(db, 'sipPlans'));
    const l: SipPlan[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as SipPlan));
    return l.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
  async savePlan(plan: SipPlan): Promise<void> {
    try {
      await setDoc(doc(db, 'sipPlans', plan.id), clean({ ...plan, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw new Error('Could not save the SIP to the online database. Check your connection and that the Firestore rules allow the "sipPlans" collection.');
    }
  },
  async deletePlan(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sipPlans', id));
    } catch (_e) {
      throw new Error('Could not delete the SIP from the online database.');
    }
  },
};

import { EventInfo, EventLead } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const fail = (what: string) => new Error(`Could not ${what}. Check your connection and that the Firestore rules allow the "events" and "eventLeads" collections.`);

/** Events (created by Head / Regional Incharge) and the event leads every admin can add to them */
export const eventsStorage = {
  async getEvents(): Promise<EventInfo[]> {
    const snap = await getDocs(collection(db, 'events'));
    const l: EventInfo[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as EventInfo));
    return l.sort((a, b) => b.date.localeCompare(a.date));
  },
  async getLeads(): Promise<EventLead[]> {
    const snap = await getDocs(collection(db, 'eventLeads'));
    const l: EventLead[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as EventLead));
    return l.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async saveEvent(e: EventInfo): Promise<void> {
    try {
      await setDoc(doc(db, 'events', e.id), clean({ ...e, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('save the event');
    }
  },
  async saveLead(l: EventLead): Promise<void> {
    try {
      await setDoc(doc(db, 'eventLeads', l.id), clean({ ...l, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('save the event lead');
    }
  },
  async deleteLead(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'eventLeads', id));
    } catch (_e) {
      throw fail('delete the event lead');
    }
  },
  /** Deletes an event together with all of its leads */
  async deleteEvent(id: string, leadIds: string[]): Promise<void> {
    try {
      const b = writeBatch(db);
      leadIds.forEach((x) => b.delete(doc(db, 'eventLeads', x)));
      b.delete(doc(db, 'events', id));
      await b.commit();
    } catch (_e) {
      throw fail('delete the event');
    }
  },
};

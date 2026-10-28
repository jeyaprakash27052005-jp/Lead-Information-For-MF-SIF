import { SiteItem, SiteMenu } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const fail = (what: string) => new Error(`Could not ${what}. Check your connection and that the Firestore rules allow the "siteMenus" and "siteItems" collections.`);

/** Menus and pages of the advertising website: read by everyone, changed only from the admin portal (Head and Regional Incharge) */
export const siteStorage = {
  async getMenus(): Promise<SiteMenu[]> {
    const snap = await getDocs(collection(db, 'siteMenus'));
    const l: SiteMenu[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as SiteMenu));
    return l.sort((a, b) => a.order - b.order);
  },
  async getItems(): Promise<SiteItem[]> {
    const snap = await getDocs(collection(db, 'siteItems'));
    const l: SiteItem[] = [];
    snap.forEach((d) => l.push({ ...d.data(), id: d.id } as SiteItem));
    return l.sort((a, b) => a.order - b.order);
  },
  async saveMenu(menu: SiteMenu): Promise<void> {
    try {
      await setDoc(doc(db, 'siteMenus', menu.id), clean({ ...menu, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('save the menu');
    }
  },
  async saveItem(item: SiteItem): Promise<void> {
    try {
      await setDoc(doc(db, 'siteItems', item.id), clean({ ...item, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('save the page');
    }
  },
  async patchItem(id: string, data: Partial<SiteItem>): Promise<void> {
    try {
      await updateDoc(doc(db, 'siteItems', id), clean({ ...data, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('change the page');
    }
  },
  async patchMenu(id: string, data: Partial<SiteMenu>): Promise<void> {
    try {
      await updateDoc(doc(db, 'siteMenus', id), clean({ ...data, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw fail('change the menu');
    }
  },
  async deleteItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'siteItems', id));
    } catch (_e) {
      throw fail('delete the page');
    }
  },
  /** Deletes a menu together with all of its pages */
  async deleteMenu(id: string, itemIds: string[]): Promise<void> {
    try {
      await Promise.all(itemIds.map((x) => deleteDoc(doc(db, 'siteItems', x))));
      await deleteDoc(doc(db, 'siteMenus', id));
    } catch (_e) {
      throw fail('delete the menu');
    }
  },
  async seed(menus: SiteMenu[], items: SiteItem[], by: string): Promise<void> {
    try {
      await Promise.all([
        ...menus.map((x) => setDoc(doc(db, 'siteMenus', x.id), clean(x))),
        ...items.map((x) => setDoc(doc(db, 'siteItems', x.id), clean({ ...x, createdBy: by }))),
      ]);
    } catch (_e) {
      throw fail('load the starter menu');
    }
  },
};

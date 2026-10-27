import { FundAd } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const CACHE_KEY = 'leadflow_fund_ads';

const cache = (ads: FundAd[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ads));
  } catch (_e) {
    // ignore
  }
};
const readCache = (): FundAd[] => {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(v) ? (v as FundAd[]).sort((a, b) => a.order - b.order) : [];
  } catch (_e) {
    return [];
  }
};
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

/** Mutual fund advertisements: read by everyone, added / changed / deleted only from the admin portal */
export const fundAdsStorage = {
  async getAds(): Promise<FundAd[]> {
    try {
      const snap = await getDocs(collection(db, 'fundAds'));
      const ads: FundAd[] = [];
      snap.forEach((d) => ads.push({ ...d.data(), id: d.id } as FundAd));
      ads.sort((a, b) => a.order - b.order);
      cache(ads);
      return ads;
    } catch (_e) {
      return readCache();
    }
  },

  async createAd(data: Omit<FundAd, 'id' | 'createdAt'>, by: string): Promise<FundAd> {
    const id = `fad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ad: FundAd = { ...data, id, createdAt: new Date().toISOString(), createdBy: by };
    try {
      await setDoc(doc(db, 'fundAds', id), clean(ad));
    } catch (_e) {
      throw new Error('Could not save the advertisement to the online database. Check your connection and that the Firestore rules allow the "fundAds" collection.');
    }
    return ad;
  },

  async updateAd(id: string, data: Partial<FundAd>): Promise<void> {
    try {
      await updateDoc(doc(db, 'fundAds', id), clean({ ...data, id, updatedAt: new Date().toISOString() }));
    } catch (_e) {
      throw new Error('Could not update the advertisement in the online database.');
    }
  },

  async deleteAd(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'fundAds', id));
    } catch (_e) {
      throw new Error('Could not delete the advertisement from the online database.');
    }
  },

  async reorder(ads: FundAd[]): Promise<void> {
    await Promise.all(ads.map((a, i) => updateDoc(doc(db, 'fundAds', a.id), { order: i + 1 }).catch(() => undefined)));
  },
};

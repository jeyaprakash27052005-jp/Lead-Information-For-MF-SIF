import { AdBanner } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'leadflow_custom_ads';

export const DEFAULT_ADS: AdBanner[] = [
  {
    id: 'ad_sif_compounding',
    title: 'Mutual Fund SIF Compounding Advantage',
    subtitle: 'Build long-term generational wealth with systematic equity compounding. Start with ₹500/month.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'mf-calc',
    badge: 'High Yield SIF',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad_nps_tax_saver',
    title: 'NPS Tier I Pension Wealth & Tax Exemption',
    subtitle: 'Claim exclusive ₹50,000 tax deduction under Sec 80CCD(1B) plus up to 60% tax-free lump sum at 60.',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'nps-calc',
    badge: 'Sec 80CCD(1B)',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ad_investor_account',
    title: 'Instant Investor Registration & Calculation',
    subtitle: 'Register your account instantly. Calculate SIP compounding and download official PDF scheme reports.',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'register',
    badge: 'Instant Access',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

export const adsStorageService = {
  // Read ads from localStorage and Firestore
  async getAds(): Promise<AdBanner[]> {
    try {
      // 1. Try reading from Firestore if possible
      const snap = await getDocs(collection(db, 'ads')).catch(() => null);
      if (snap && !snap.empty) {
        const firestoreAds: AdBanner[] = [];
        snap.forEach((d) => {
          firestoreAds.push({ ...d.data(), id: d.id } as AdBanner);
        });
        firestoreAds.sort((a, b) => a.order - b.order);
        // Cache to localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(firestoreAds));
        return firestoreAds;
      }
    } catch (_err) {
      // ignore
    }

    // 2. Read from localStorage
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local) as AdBanner[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.sort((a, b) => a.order - b.order);
          return parsed;
        }
      }
    } catch (_err) {
      // ignore
    }

    // 3. Fallback to default ads
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_ADS));
    } catch (_e) {
      // ignore
    }
    return DEFAULT_ADS;
  },

  async createAd(adData: Omit<AdBanner, 'id' | 'createdAt'>): Promise<AdBanner> {
    const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAd: AdBanner = {
      ...adData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // Update localStorage
    try {
      const current = await this.getAds();
      const updated = [...current, newAd];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (_e) {
      // ignore
    }

    // Try save to Firestore
    try {
      await setDoc(doc(db, 'ads', newId), newAd);
    } catch (_err) {
      // localStorage backup exists
    }

    return newAd;
  },

  async updateAd(id: string, adData: Partial<AdBanner>): Promise<AdBanner> {
    const current = await this.getAds();
    const existing = current.find((a) => a.id === id);
    if (!existing) throw new Error('Ad banner not found');

    const updated: AdBanner = {
      ...existing,
      ...adData,
      id,
    };

    const nextAds = current.map((a) => (a.id === id ? updated : a));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextAds));
    } catch (_e) {
      // ignore
    }

    try {
      await updateDoc(doc(db, 'ads', id), updated as Record<string, any>);
    } catch (_err) {
      // ignore
    }

    return updated;
  },

  async deleteAd(id: string): Promise<void> {
    const current = await this.getAds();
    const filtered = current.filter((a) => a.id !== id);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (_e) {
      // ignore
    }

    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (_err) {
      // ignore
    }
  },

  async reorderAds(ads: AdBanner[]): Promise<void> {
    const reordered = ads.map((ad, idx) => ({ ...ad, order: idx + 1 }));
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reordered));
    } catch (_e) {
      // ignore
    }
    for (const ad of reordered) {
      try {
        await updateDoc(doc(db, 'ads', ad.id), { order: ad.order });
      } catch (_e) {
        // ignore
      }
    }
  },
};

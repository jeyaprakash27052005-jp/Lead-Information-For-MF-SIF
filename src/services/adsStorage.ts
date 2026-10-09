import { AdBanner } from '../types';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'leadflow_custom_ads';

// Firestore documents are limited to 1 MiB, so an uploaded image (stored as a data URL)
// must stay below this many characters.
export const MAX_IMAGE_DATA_URL_LENGTH = 850_000;

const cacheAds = (ads: AdBanner[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ads));
  } catch (_e) {
    // ignore
  }
};

const readCache = (): AdBanner[] => {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local) as AdBanner[];
      if (Array.isArray(parsed)) return parsed.sort((a, b) => a.order - b.order);
    }
  } catch (_e) {
    // ignore
  }
  return [];
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('This image could not be opened.'));
    img.src = src;
  });

/**
 * Turns an uploaded JPG / JPEG / PNG / GIF into a data URL small enough to be stored
 * in the online database. JPG/PNG are resized and re-compressed automatically.
 * GIFs are kept as-is (so they keep moving) and must already be small enough.
 */
export const prepareAdImage = async (file: File): Promise<string> => {
  const original = await readFileAsDataUrl(file);
  const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name);

  if (isGif) {
    if (original.length > MAX_IMAGE_DATA_URL_LENGTH) {
      throw new Error(
        'This GIF is too large to store (limit is about 600 KB). Please upload a smaller GIF, or a JPG / PNG.'
      );
    }
    return original;
  }

  if (original.length <= MAX_IMAGE_DATA_URL_LENGTH && file.size <= 600 * 1024) {
    return original;
  }

  const img = await loadImage(original);
  let maxSide = 1600;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not supported in this browser.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55]) {
      const out = canvas.toDataURL('image/jpeg', quality);
      if (out.length <= MAX_IMAGE_DATA_URL_LENGTH) return out;
    }
    maxSide = Math.round(maxSide * 0.75);
  }
  throw new Error('This image is too large to store. Please choose a smaller image.');
};

export const adsStorageService = {
  // The online database is the single source of truth, so ads uploaded in the admin site
  // appear on every device and on the customer site. The browser cache is only used
  // when the database cannot be reached.
  async getAds(): Promise<AdBanner[]> {
    try {
      const snap = await getDocs(collection(db, 'ads'));
      const ads: AdBanner[] = [];
      snap.forEach((d) => {
        ads.push({ ...d.data(), id: d.id } as AdBanner);
      });
      ads.sort((a, b) => a.order - b.order);
      cacheAds(ads);
      return ads;
    } catch (_err) {
      return readCache();
    }
  },

  async createAd(adData: Omit<AdBanner, 'id' | 'createdAt'>): Promise<AdBanner> {
    const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAd: AdBanner = {
      ...adData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    // Firestore rejects undefined fields
    const payload = JSON.parse(JSON.stringify(newAd));
    try {
      await setDoc(doc(db, 'ads', newId), payload);
    } catch (_err) {
      throw new Error(
        'Could not save the ad to the online database. Check your connection and that the Firestore rules allow the "ads" collection.'
      );
    }
    cacheAds([...readCache(), newAd]);
    return newAd;
  },

  async updateAd(id: string, adData: Partial<AdBanner>): Promise<AdBanner> {
    const current = await this.getAds();
    const existing = current.find((a) => a.id === id);
    if (!existing) throw new Error('Ad banner not found');

    const updated: AdBanner = { ...existing, ...adData, id };
    try {
      await updateDoc(doc(db, 'ads', id), JSON.parse(JSON.stringify(updated)));
    } catch (_err) {
      throw new Error('Could not update the ad in the online database.');
    }
    cacheAds(current.map((a) => (a.id === id ? updated : a)));
    return updated;
  },

  async deleteAd(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (_err) {
      throw new Error('Could not delete the ad from the online database.');
    }
    cacheAds(readCache().filter((a) => a.id !== id));
  },

  async reorderAds(ads: AdBanner[]): Promise<void> {
    const reordered = ads.map((ad, idx) => ({ ...ad, order: idx + 1 }));
    cacheAds(reordered);
    for (const ad of reordered) {
      try {
        await updateDoc(doc(db, 'ads', ad.id), { order: ad.order });
      } catch (_e) {
        // ignore
      }
    }
  },
};

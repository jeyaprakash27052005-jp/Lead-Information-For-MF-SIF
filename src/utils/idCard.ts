import QRCode from 'qrcode';
import { AwarenessProgram, SessionRegistration } from '../types';
import { formatDateTime } from './dateTime';

export const cardNo = (r: SessionRegistration) => `${r.programId.slice(-4)}-${r.mobile.slice(-4)}`.toUpperCase();

/** The address the QR code opens: the ID card page of the advertising website */
export const cardUrl = (token: string) => `${window.location.origin}${window.location.pathname}#/id/${token}`;

export const qrImage = (text: string, size = 220): Promise<string> => QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M' });

const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

/** Draws the ID card (with its QR code) and downloads it as a picture */
export const downloadCard = async (r: SessionRegistration, p: AwarenessProgram) => {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 560;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 900, 560);
  g.fillStyle = '#1d4ed8';
  g.fillRect(0, 0, 900, 110);
  g.fillStyle = '#ffffff';
  g.font = 'bold 22px sans-serif';
  g.fillText('EVENT ID CARD', 40, 45);
  g.font = 'bold 30px sans-serif';
  g.fillText(p.title.length > 44 ? `${p.title.slice(0, 43)}...` : p.title, 40, 88);
  if (r.cardPhoto) {
    try {
      g.drawImage(await loadImg(r.cardPhoto), 40, 150, 200, 200);
    } catch (_e) {
      /* no photo */
    }
  } else {
    g.fillStyle = '#e2e8f0';
    g.fillRect(40, 150, 200, 200);
  }
  g.fillStyle = '#0f172a';
  g.font = 'bold 36px sans-serif';
  g.fillText(r.cardName || r.name, 270, 190);
  g.font = '24px sans-serif';
  g.fillStyle = '#334155';
  const lines = [r.cardOccupation, r.cardCity, `Date: ${formatDateTime(p.startsAt)}`, p.mode === 'offline' && p.venue ? `Venue: ${p.venue}` : 'Online session'].filter(Boolean) as string[];
  lines.forEach((t, i) => g.fillText(t.length > 30 ? `${t.slice(0, 29)}...` : t, 270, 245 + i * 40));
  if (r.cardToken) {
    try {
      g.drawImage(await loadImg(await qrImage(cardUrl(r.cardToken), 240)), 640, 300, 220, 220);
    } catch (_e) {
      /* no QR */
    }
  }
  g.fillStyle = '#1d4ed8';
  g.font = 'bold 28px monospace';
  g.fillText(`ID: ${cardNo(r)}`, 40, 480);
  g.fillStyle = '#64748b';
  g.font = '18px sans-serif';
  g.fillText(`Registered as ${r.attendeeType}${r.guests ? ` (+${r.guests} guest${r.guests > 1 ? 's' : ''})` : ''}`, 40, 520);
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = `id-card-${cardNo(r)}.png`;
  a.click();
};

/** A small square photo (about 10-20 KB) for the ID card */
export const smallPhoto = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 240;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const m = Math.min(img.width, img.height);
      c.getContext('2d')!.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not a picture.'));
    };
    img.src = url;
  });


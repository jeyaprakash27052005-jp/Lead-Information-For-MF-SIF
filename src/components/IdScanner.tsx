import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CheckCircle2, ScanLine, X } from 'lucide-react';
import { AwarenessProgram, SessionRegistration } from '../types';
import { sessionRegStorage } from '../services/sessionRegStorage';
import { cardNo } from '../utils/idCard';
import { formatDateTime } from '../utils/dateTime';

/** The code in a scanned QR address (or a code typed by hand) */
const tokenFrom = (text: string): string => {
  const m = text.match(/#\/id\/([a-f0-9]{24})/i);
  return (m ? m[1] : text.trim()).toLowerCase();
};

/** Admin: scan the QR code of an ID card, check the person and mark them present */
export const IdScanner: React.FC<{ programs: AwarenessProgram[]; by: string; onChanged: () => void; onClose: () => void }> = ({ programs, by, onChanged, onClose }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [cam, setCam] = useState(false);
  const [manual, setManual] = useState('');
  const [reg, setReg] = useState<SessionRegistration | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const lookup = async (text: string) => {
    setMsg(null);
    try {
      const r = await sessionRegStorage.getByToken(tokenFrom(text));
      if (!r) return setMsg('This ID card was not found.');
      setReg(r);
      setCam(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not open the ID card.');
    }
  };

  useEffect(() => {
    if (!cam) return;
    let stop = false;
    let stream: MediaStream | null = null;
    const canvas = document.createElement('canvas');
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stop || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (stop || !v) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const g = canvas.getContext('2d', { willReadFrequently: true })!;
            g.drawImage(v, 0, 0);
            const code = jsQR(g.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
            if (code?.data) {
              lookup(code.data);
              return;
            }
          }
          requestAnimationFrame(tick);
        };
        tick();
      } catch (_e) {
        setMsg('The camera could not be opened. Allow camera access, or type the code below.');
        setCam(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cam]);

  const mark = async (present: boolean) => {
    if (!reg) return;
    try {
      await sessionRegStorage.setPresent(reg.id, present, by);
      setReg({ ...reg, present, presentAt: present ? new Date().toISOString() : '', presentBy: present ? by : '' });
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    }
  };
  const p = reg ? programs.find((x) => x.id === reg.programId) : undefined;

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-4 space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-black text-slate-900 text-sm flex items-center gap-2"><ScanLine className="w-4 h-4 text-blue-700" /> Scan ID card</p>
        <button type="button" onClick={onClose} aria-label="Close scanner" className="p-1 cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      {msg && <p role="alert" className="font-semibold text-rose-700">{msg}</p>}
      {cam ? (
        <div className="space-y-2">
          <video ref={video} playsInline muted className="w-full max-w-sm rounded-xl bg-black" />
          <button type="button" onClick={() => setCam(false)} className="px-3 py-2 rounded-lg border border-slate-300 font-bold cursor-pointer">Stop camera</button>
        </div>
      ) : (
        <button type="button" onClick={() => { setReg(null); setCam(true); }} className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-2 cursor-pointer">
          <Camera className="w-4 h-4" /> Scan QR code with camera
        </button>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (manual.trim()) lookup(manual); }} className="flex gap-2">
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or paste the ID card link / code" className="flex-1 px-3 py-2 rounded-lg border border-slate-300" />
        <button type="submit" className="px-3 py-2 rounded-lg border border-slate-300 font-bold cursor-pointer">Check</button>
      </form>
      {reg && (
        <div className="border border-slate-200 rounded-xl p-3 flex gap-3">
          {reg.cardPhoto ? <img src={reg.cardPhoto} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-200" /> : <div className="w-20 h-20 rounded-lg bg-slate-100" />}
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-black text-slate-900">{reg.cardName || reg.name}</p>
            <p className="font-mono font-bold text-blue-700">ID: {cardNo(reg)}</p>
            <p className="text-slate-600">{reg.programTitle}</p>
            {p && <p className="text-slate-500">{formatDateTime(p.startsAt)}</p>}
            <p className="text-slate-600">{reg.mobile}{reg.guests ? ` • +${reg.guests} guest${reg.guests > 1 ? 's' : ''}` : ''}{reg.amount ? ` • Paid ₹${reg.amount}` : ''}</p>
            {reg.present ? (
              <>
                <p className="font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Present{reg.presentAt ? ` since ${formatDateTime(reg.presentAt)}` : ''}</p>
                <button type="button" onClick={() => mark(false)} className="text-rose-700 font-bold cursor-pointer">Undo present</button>
              </>
            ) : (
              <button type="button" onClick={() => mark(true)} className="mt-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">Mark present</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

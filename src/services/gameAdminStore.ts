import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { db, ensureFirestoreDatabaseSeeded, handleFirestoreError, OperationType } from './firebase';
import { User } from '../types';
import { GAME_LIST } from '../gameAdmin/games';

/** One player of one game, as saved by the games site and apps (collection gamePlayers). */
export interface GamePlayer {
  id: string;
  game: string;
  gameName: string;
  name: string;
  mobile: string;
  email: string;
  age: number;
  lang: string;
  mode: string;
  device: string;
  status: 'started' | 'finished' | string;
  registeredAt: string;
  result?: string;
  score?: number;
  finishedAt?: string;
  details?: Record<string, unknown>;
}

/** What the Head Incharge sets for the games (settings/gameHub). Read by every game page and app. */
export interface HubSettings {
  enabled: Record<string, boolean>;
  onePlay: Record<string, boolean>;
  order: string[];
  mover: 'dice' | 'spinner';
  updatedAt?: string;
  updatedBy?: string;
}

const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));

export function cleanHub(raw: Partial<HubSettings> | undefined): HubSettings {
  const r = raw || {};
  const ids = GAME_LIST.map((g) => g.id);
  const order = (Array.isArray(r.order) ? r.order : []).filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i);
  ids.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });
  const flags = (o: unknown) => {
    const out: Record<string, boolean> = {};
    if (o && typeof o === 'object') Object.entries(o as Record<string, unknown>).forEach(([k, v]) => ids.includes(k) && typeof v === 'boolean' && (out[k] = v));
    return out;
  };
  return { enabled: flags(r.enabled), onePlay: flags(r.onePlay), order, mover: r.mover === 'spinner' ? 'spinner' : 'dice', updatedAt: r.updatedAt, updatedBy: r.updatedBy };
}

export const gameAdminStore = {
  async listPlayers(): Promise<GamePlayer[]> {
    try {
      const snap = await getDocs(collection(db, 'gamePlayers'));
      const out: GamePlayer[] = [];
      snap.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        out.push({
          id: d.id,
          game: str(x.game),
          gameName: str(x.gameName) || GAME_LIST.find((g) => g.id === x.game)?.name || str(x.game),
          name: str(x.name),
          mobile: str(x.mobile),
          email: str(x.email),
          age: typeof x.age === 'number' ? x.age : 0,
          lang: str(x.lang),
          mode: str(x.mode),
          device: str(x.device),
          status: str(x.status) || 'started',
          registeredAt: str(x.registeredAt),
          result: str(x.result),
          score: typeof x.score === 'number' ? x.score : undefined,
          finishedAt: str(x.finishedAt),
          details: x.details && typeof x.details === 'object' ? (x.details as Record<string, unknown>) : undefined,
        });
      });
      return out.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'gamePlayers');
    }
  },

  /** Deletes player records (up to 450 per batch). Head Incharge only. */
  async deletePlayers(head: User, ids: string[]): Promise<void> {
    if (head.role !== 'head') throw new Error('Only the Head Incharge can delete game records.');
    try {
      for (let i = 0; i < ids.length; i += 450) {
        const b = writeBatch(db);
        ids.slice(i, i + 450).forEach((id) => b.delete(doc(db, 'gamePlayers', id)));
        await b.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'gamePlayers');
    }
  },

  async getHub(): Promise<HubSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'gameHub'));
      return cleanHub(snap.exists() ? (snap.data() as Partial<HubSettings>) : undefined);
    } catch (_e) {
      return cleanHub(undefined);
    }
  },

  async saveHub(head: User, s: HubSettings): Promise<HubSettings> {
    if (head.role !== 'head') throw new Error('Only the Head Incharge can change the games.');
    await ensureFirestoreDatabaseSeeded();
    const clean: HubSettings = { ...cleanHub(s), updatedAt: new Date().toISOString(), updatedBy: `${head.name} (Head Incharge)`.slice(0, 200) };
    try {
      await setDoc(doc(db, 'settings', 'gameHub'), JSON.parse(JSON.stringify(clean)));
      return clean;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/gameHub');
    }
  },
};

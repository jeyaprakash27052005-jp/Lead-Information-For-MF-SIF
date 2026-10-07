import { firebaseDbService } from './firebase';

// Counts every write (create / update / delete) so a background refresh can tell
// whether the data it fetched is older than a change the user just made.
let writeVersion = 0;
export const getWriteVersion = () => writeVersion;

export const apiService = new Proxy(firebaseDbService, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value !== 'function' || typeof prop !== 'string' || prop.startsWith('get')) {
      return value;
    }
    return async (...args: unknown[]) => {
      writeVersion++;
      try {
        return await (value as (...a: unknown[]) => Promise<unknown>).apply(target, args);
      } finally {
        writeVersion++;
      }
    };
  },
}) as typeof firebaseDbService;

export { testConnection, handleFirestoreError, OperationType } from './firebase';

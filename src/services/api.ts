import { firebaseDbService } from './firebase';

export const apiService = firebaseDbService;
export { testConnection, handleFirestoreError, OperationType } from './firebase';

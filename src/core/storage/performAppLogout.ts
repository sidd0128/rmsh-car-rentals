import { signOutFirebaseUser } from '@core/firebase/auth/services/firebaseAuthService';
import { resetDomainStores } from './resetDomainStores';
import { storageService } from './storageService';

/**
 * Signs out Firebase, wipes all AsyncStorage (domain data, sync metadata, Zustand persist,
 * and auth persistence keys), and resets in-memory stores.
 * On next login, AppProvider syncs from Firestore and hydrates repositories again.
 */
export const performAppLogout = async (): Promise<void> => {
  await signOutFirebaseUser();
  await storageService.clear();
  resetDomainStores();
};

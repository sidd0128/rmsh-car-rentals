/**
 * React Native persistence is provided by the RN Auth bundle at runtime (Metro).
 * This augmentation exposes `getReactNativePersistence` to TypeScript.
 */
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage,
  ): Persistence;
}

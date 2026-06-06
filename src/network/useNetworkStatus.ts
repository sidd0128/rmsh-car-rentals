import { createContext, useContext } from 'react';
import type { NetworkContextValue } from './networkTypes';

export const NetworkStatusContext = createContext<NetworkContextValue | undefined>(undefined);

export const useNetworkStatus = (): NetworkContextValue => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkProvider');
  }
  return context;
};

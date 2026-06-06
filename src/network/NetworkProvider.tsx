import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { NetInfoStateType } from '@react-native-community/netinfo';
import { networkService } from './networkService';
import { NetworkStatusContext } from './useNetworkStatus';
import type { NetworkStatus } from './networkTypes';

interface NetworkProviderProps {
  children: ReactNode;
}

const initialStatus: NetworkStatus = {
  isConnected: null,
  isInternetReachable: null,
  type: NetInfoStateType.unknown,
};

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [status, setStatus] = useState<NetworkStatus>(initialStatus);
  const [isRefreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setStatus(await networkService.fetchStatus());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
    return networkService.subscribe(setStatus);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ...status,
      isRefreshing,
      refresh,
    }),
    [isRefreshing, refresh, status],
  );

  return (
    <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>
  );
};

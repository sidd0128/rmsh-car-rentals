import type { NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
}

export interface NetworkContextValue extends NetworkStatus {
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

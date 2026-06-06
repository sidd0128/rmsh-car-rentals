import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';
import type { NetworkStatus } from './networkTypes';

const toNetworkStatus = (state: NetInfoState): NetworkStatus => ({
  isConnected: state.isConnected,
  isInternetReachable: state.isInternetReachable,
  type: state.type,
});

export const networkService = {
  async fetchStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    return toNetworkStatus(state);
  },

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    return NetInfo.addEventListener(state => listener(toNetworkStatus(state)));
  },
};

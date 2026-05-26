import NetInfo from '@react-native-community/netinfo';

/**
 * Tracks whether the device can reach the internet (used before Firestore sync).
 */
export const networkConnectivityService = {
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  },

  subscribe(listener: (online: boolean) => void): () => void {
    return NetInfo.addEventListener(state => {
      listener(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  },
};

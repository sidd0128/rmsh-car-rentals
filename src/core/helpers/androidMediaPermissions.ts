import { PermissionsAndroid, Platform } from 'react-native';

/** Request camera access before `launchCamera` when declared in AndroidManifest. */
export const ensureAndroidCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: 'Camera permission',
    message: 'RMSH Rentals needs camera access to photograph your cars and documents.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

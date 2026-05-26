import { PermissionsAndroid, Platform } from 'react-native';
import i18n from '@core/i18n';

export const ensureAndroidCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: i18n.t('media.cameraPermissionTitle'),
    message: i18n.t('media.cameraPermissionMessage'),
    buttonPositive: i18n.t('common.allow'),
    buttonNegative: i18n.t('common.cancel'),
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

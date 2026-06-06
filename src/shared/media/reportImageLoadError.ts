import { logError } from '@error/errorLogger';

export const reportImageLoadError = (uri: string, source: string): void => {
  if (uri.startsWith('file://')) {
    if (__DEV__) {
      console.warn(
        `[RMSHRentals] Ignoring stale local image path in ${source}. Reupload this image to save it in Firebase Storage.`,
      );
    }
    return;
  }

  logError(new Error(`Could not load image from: ${uri}`), { source });
};

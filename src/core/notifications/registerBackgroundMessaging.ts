import messaging from '@react-native-firebase/messaging';
import { logError } from '@error/errorLogger';
import { pushNotificationDisplayService } from './pushNotificationDisplayService';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage.notification) {
    return;
  }

  await pushNotificationDisplayService
    .displayBookingRequestNotification(remoteMessage)
    .catch(error =>
      logError(error, { source: 'registerBackgroundMessaging' }),
    );
});

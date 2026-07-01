import notifee, { AndroidImportance } from '@notifee/react-native';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const BOOKING_REQUEST_CHANNEL_ID = 'booking_requests';

const getMessageText = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): { title: string; body: string } => {
  const title =
    remoteMessage.notification?.title ??
    remoteMessage.data?.title?.toString() ??
    'New booking request';
  const body =
    remoteMessage.notification?.body ??
    remoteMessage.data?.body?.toString() ??
    'A new customer booking request has been received.';

  return { title, body };
};

export const pushNotificationDisplayService = {
  async ensureBookingRequestChannel(): Promise<string> {
    return notifee.createChannel({
      id: BOOKING_REQUEST_CHANNEL_ID,
      name: 'Booking requests',
      importance: AndroidImportance.HIGH,
    });
  },

  async displayBookingRequestNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  ): Promise<void> {
    const { title, body } = getMessageText(remoteMessage);
    const channelId = await this.ensureBookingRequestChannel();

    await notifee.displayNotification({
      title,
      body,
      data: remoteMessage.data,
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: 'default',
      },
    });
  },
};

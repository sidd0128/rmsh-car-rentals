const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

const BOOKING_REQUEST_CHANNEL_ID = 'booking_requests';

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const removeInvalidTokens = async (tokens, responses) => {
  const invalidTokenCodes = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
  ]);

  const batch = admin.firestore().batch();
  let invalidCount = 0;

  responses.forEach((response, index) => {
    if (response.success) {
      return;
    }

    const code = response.error && response.error.code;
    if (!invalidTokenCodes.has(code)) {
      return;
    }

    invalidCount += 1;
    batch.delete(
      admin
        .firestore()
        .collection('deviceTokens')
        .doc(encodeURIComponent(tokens[index])),
    );
  });

  if (invalidCount > 0) {
    await batch.commit();
  }
};

exports.notifyAdminsOnBookingRequestCreated = onDocumentCreated(
  'bookingRequests/{requestId}',
  async event => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const request = snapshot.data();
    if (request.status && request.status !== 'PENDING') {
      return;
    }

    const tokenSnapshot = await admin
      .firestore()
      .collection('deviceTokens')
      .where('enabled', '==', true)
      .where('role', '==', 'admin')
      .get();

    const tokens = tokenSnapshot.docs
      .map(doc => doc.data().token)
      .filter(token => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const customerName = request.customerName || 'A customer';
    const carName = request.carName || 'a car';
    const title = 'New booking request';
    const body = `${customerName} requested ${carName}.`;

    for (const tokenGroup of chunk(tokens, 500)) {
      const result = await admin.messaging().sendEachForMulticast({
        tokens: tokenGroup,
        notification: {
          title,
          body,
        },
        data: {
          type: 'booking_request',
          requestId: snapshot.id,
          title,
          body,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: BOOKING_REQUEST_CHANNEL_ID,
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      });

      await removeInvalidTokens(tokenGroup, result.responses);
    }
  },
);

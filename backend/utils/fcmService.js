import User from '../models/User.js';
import { getFirebaseAdmin } from './firebaseAdmin.js';

export async function sendFcmToTokens(tokens, { title, body, data = {} }) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const admin = getFirebaseAdmin();

  const message = {
    tokens,
    notification: {
      title,
      body,
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
    ),
  };

  return await admin.messaging().sendEachForMulticast(message);
}

export async function sendFcmToUser(userId, payload) {
  const user = await User.findById(userId).select('fcmTokens');
  const tokens = user?.fcmTokens || [];
  return await sendFcmToTokens(tokens, payload);
}


import { getFirebaseAdmin } from './firebaseAdmin.js';

export function normalizeTo10DigitPhone(input) {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

export async function verifyFirebaseIdToken(idToken) {
  if (!idToken) {
    const err = new Error('Missing Firebase ID token');
    err.statusCode = 400;
    throw err;
  }

  const admin = getFirebaseAdmin();
  return await admin.auth().verifyIdToken(idToken);
}


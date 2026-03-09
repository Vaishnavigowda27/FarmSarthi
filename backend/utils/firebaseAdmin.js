import admin from 'firebase-admin';

let initialized = false;

function parseServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (rawJson && rawJson.trim()) {
    return JSON.parse(rawJson);
  }

  if (rawB64 && rawB64.trim()) {
    const jsonString = Buffer.from(rawB64, 'base64').toString('utf8');
    return JSON.parse(jsonString);
  }

  return null;
}

export function getFirebaseAdmin() {
  if (initialized) return admin;

  if (admin.apps.length) {
    initialized = true;
    return admin;
  }

  const serviceAccount = parseServiceAccountFromEnv();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    return admin;
  }

  // Fallback to application default credentials (GOOGLE_APPLICATION_CREDENTIALS)
  // This is useful on servers where a service account file is mounted.
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  initialized = true;
  return admin;
}


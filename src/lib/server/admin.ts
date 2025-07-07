
import admin from 'firebase-admin';
import { FIREBASE_SERVICE_ACCOUNT } from '$env/static/private';

try {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

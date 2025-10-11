/**
 * Firebase Admin SDK Configuration
 * Server-side Firebase initialization for SoraIDE API
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (singleton pattern)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please check your .env file.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
    }),
  });

  console.log('✅ Firebase Admin initialized for project:', projectId);
}

// Export initialized services
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

export default admin;

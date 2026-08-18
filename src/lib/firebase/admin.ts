import * as admin from "firebase-admin";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

let adminApp: admin.app.App;

if (!admin.apps.length) {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "icat-treasurehunt-2026";

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawKey);

  if (clientEmail && privateKey) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    // Initialize with application default or project ID for local emulator/environment
    adminApp = admin.initializeApp({
      projectId,
    });
  }
} else {
  adminApp = admin.app();
}

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
export { adminApp, admin };

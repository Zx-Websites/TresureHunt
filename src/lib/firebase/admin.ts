import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

let adminApp: admin.app.App;

if (!admin.apps.length) {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "treasure-hunt-49dbb";

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawKey);

  // Check for local service account JSON file in workspace root
  const serviceAccountFile = path.resolve(
    process.cwd(),
    "treasure-hunt-49dbb-firebase-adminsdk-fbsvc-0ae90a99e9.json"
  );

  if (clientEmail && privateKey) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else if (fs.existsSync(serviceAccountFile)) {
    try {
      const fileContent = JSON.parse(fs.readFileSync(serviceAccountFile, "utf-8"));
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(fileContent),
        projectId: fileContent.project_id || projectId,
      });
    } catch (err) {
      console.warn("Failed to load serviceAccountFile, falling back to default:", err);
      adminApp = admin.initializeApp({ projectId });
    }
  } else {
    // Initialize with application default or project ID
    adminApp = admin.initializeApp({
      projectId,
    });
  }
} else {
  adminApp = admin.app();
}

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {}
export { adminApp, admin };

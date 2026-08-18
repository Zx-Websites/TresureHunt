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

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@treasure-hunt-49dbb.iam.gserviceaccount.com";

  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawKey);

  // Check if raw JSON was provided in FIREBASE_SERVICE_ACCOUNT_KEY env
  const rawServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // Check for local service account JSON file
  const localServiceAccountPath = path.resolve(
    process.cwd(),
    "treasure-hunt-49dbb-firebase-adminsdk-fbsvc-0ae90a99e9.json"
  );

  if (rawServiceAccountJson) {
    try {
      const parsed = JSON.parse(rawServiceAccountJson);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id || projectId,
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  if (!adminApp!) {
    if (clientEmail && privateKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else if (fs.existsSync(localServiceAccountPath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf-8"));
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(fileContent),
          projectId: fileContent.project_id || projectId,
        });
      } catch (err) {
        console.warn("Failed to load local service account file, falling back to default:", err);
        adminApp = admin.initializeApp({ projectId });
      }
    } else {
      // Initialize with project ID
      adminApp = admin.initializeApp({
        projectId,
      });
    }
  }
} else {
  adminApp = admin.app();
}

export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings already initialized or ignored
}

export { adminApp };

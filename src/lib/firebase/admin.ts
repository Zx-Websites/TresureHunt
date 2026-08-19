import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();

  // Strip leading and trailing quotes if user wrapped the value in quotes
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }

  // Replace literal escaped newlines "\n" with real newlines
  formatted = formatted.replace(/\\n/g, "\n");

  // Normalize windows newlines
  formatted = formatted.replace(/\r\n/g, "\n");

  return formatted.trim();
}

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "treasure-hunt-49dbb";

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    "firebase-adminsdk-fbsvc@treasure-hunt-49dbb.iam.gserviceaccount.com";

  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawKey);

  // 1. Try raw JSON string from FIREBASE_SERVICE_ACCOUNT_KEY env
  const rawServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawServiceAccountJson) {
    try {
      const parsed = JSON.parse(rawServiceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
        projectId: parsed.project_id || projectId,
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  // 2. Try clientEmail + privateKey env vars
  if (clientEmail && privateKey) {
    try {
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (certErr) {
      console.warn("Failed to initialize Firebase Admin with cert env vars:", certErr);
    }
  }

  // 3. Try local service account file (for local development)
  try {
    const localServiceAccountPath = path.resolve(
      process.cwd(),
      "treasure-hunt-49dbb-firebase-adminsdk-fbsvc-0ae90a99e9.json"
    );
    if (fs.existsSync(localServiceAccountPath)) {
      const fileContent = JSON.parse(fs.readFileSync(localServiceAccountPath, "utf-8"));
      return admin.initializeApp({
        credential: admin.credential.cert(fileContent),
        projectId: fileContent.project_id || projectId,
      });
    }
  } catch (fsErr) {
    console.warn("Local service account file check failed:", fsErr);
  }

  // 4. Safe fallback for Next.js build-time static evaluation
  return admin.initializeApp({ projectId });
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings already initialized or ignored
}

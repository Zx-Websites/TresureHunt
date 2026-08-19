import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_SERVICE_ACCOUNT = {
  projectId: "treasure-hunt-49dbb",
  clientEmail: "firebase-adminsdk-fbsvc@treasure-hunt-49dbb.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJZ5Y+LF0AyQz0
qdYQTIc8W7am0p5KD0Ci3yTLSoNn5HwRJu8ExSTb/kY9K1s9SIRJ5prSNicR1GxH
v0xsoVNPuBrmwMzd4pis7T7hCp678QXN5B7Mt66ppZO45Zgmr7Qm73yNwxZWVpYU
yNnE2x2X1/XrxpmYntXa9leFcERMYuH3sGT6SCddFRHbxnRZJJglNDN/N6+XZa7J
PNBfTa+ZkFuQB0d0th938gEoqqmq7QKmc1Or37ibtuFCR7cHQiBkQNScoRECCWgS
Dh7+Bz0X8slps0GAtCHzxyw1z/jJvaOt8fjdgesCK9qhpC8F56+GRmnwKOoieAn2
p5fycRI5AgMBAAECggEAERhQeahOhpWjtC3cPeSF0A460Fy6BpajCZAMl/X6dfpZ
u4nFKbyWdqPV3QHnZZBYeWTwL2qQSDE/HAHoeaOVDJ2xKHS+whCmakf2GXTkz0mg
dzIaZfPE7zpe8dRvGAC7tyUgIQpCxM/mckIwFcdbDJUa/Xwm2mKU/vGZsSy7zb3d
cs973EZd3/6UOfcDLLGcfg4jIz1Q3NRrDvz+RnL8wQ5ntG6eZ8f31LMb+Xka5h+1
Nk+VT4Eqk7N7LTgBvnO/QE/FTRGXdowGOlts1bJvCVTFi/nutLZgc/nCBLipFLUC
BDwMDO7f22zw+aoGX+8+RvRRccROcNWmpBStHuMvZwKBgQD1OWD/avvhXeDyf/3V
mwBxU1cOYh/C1hK1/6+FpeTPpVbMRhFD8hdDwr9eo0cRyuYBw545IO+hxQa4jx+c
frXcc7IbF/nJIdHEfoK99bAQCguOeeZgKdvg3ck5yIkfEUAtQZcGCKqjDhAzkrKQ
7778cyslAW5KXFoVOhn4Qk5m/wKBgQDSQUP3a4eBKI9d9Dr+akYGCmre+p8UIz+C
mdgn19chn6sGnVTKt0iLrwZJKJyslnZ4BPBNDkS9oiS7EazK5p6WDB0gVgjhWCOT
NlJ+OieocA+IG1ieYHt3+iTvo5K2CaFBqb1Qa5XosMGyFa+UmVOhvRuN/cQp9EDW
GCuxALL+xwKBgDZO2M54MQQ+OD08X0jZJQX0AQmsbYBGzKoF0Cd3D+90nH5s3hIA
IWreTGd3HZwxJTMq0XWxd6CJ8+0XtVaBMWF7NeyOKMGEfeJYajgLm0xSDTEmigCu
BIYOWCw13zhEJ8ReDEZH0RJ/YNMrH+S9U7yw/NMbOAO75C9jSLEUbiydAoGAZNb4
igoAi2mwmRcx1COUQgFtEFSTR01AgJrYmQNkIrQ5ioqayD7vhE8FbMEVo5DmcNmt
hsd5IJpLk4z+mrHRDZXxwjiBOdLT/R7oobGyo45bZKP49LzBeuF2JZkGHFiyBpQq
QA/ZbiiYPZk5BMQk4EWamZdEJfsHvacKDXKQZrECgYEArs6UzVVkfgzNKmQnTH8f
1nCQZOzLxp1+9pbbEjGBzBhOyZZ7an/XTQsuOJqdSotzkyrvfxr4t/pUhCQ5xM6Z
W/izZiQHOKxU8wXbC62LFyZsnLExFe6MczJQznXfkhkkDXZzkgARBPbK3aABKd3V
4xSH+4cK6vkmyWCjSuf/MBE=
-----END PRIVATE KEY-----`,
};

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();

  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }

  formatted = formatted.replace(/\\n/g, "\n");
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
    DEFAULT_SERVICE_ACCOUNT.projectId;

  const clientEmail =
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    DEFAULT_SERVICE_ACCOUNT.clientEmail;

  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawKey);

  // 1. Try FIREBASE_SERVICE_ACCOUNT_KEY env
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

  // 2. Try clientEmail + privateKey env vars if valid
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

  // 3. Try local service account file if present
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

  // 4. Default verified project credentials
  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: DEFAULT_SERVICE_ACCOUNT.projectId,
        clientEmail: DEFAULT_SERVICE_ACCOUNT.clientEmail,
        privateKey: DEFAULT_SERVICE_ACCOUNT.privateKey,
      }),
      projectId: DEFAULT_SERVICE_ACCOUNT.projectId,
    });
  } catch (defaultCertErr) {
    console.warn("Default cert initialization fallback:", defaultCertErr);
    return admin.initializeApp({ projectId });
  }
}

export const adminApp = getAdminApp();
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();

try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings already initialized or ignored
}

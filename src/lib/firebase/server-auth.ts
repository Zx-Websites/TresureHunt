import { adminAuth } from "./admin";

export interface VerifiedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  role?: string;
}

export async function verifyAuthToken(req: Request): Promise<VerifiedUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    // Check if token was provided in custom headers or cookie
    token = req.headers.get("x-firebase-token");
  }

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      role: (decodedToken.role as string) || "student",
    };
  } catch (err: unknown) {
    // If running in development without a live service account key, check for mock/fallback token
    if (process.env.NODE_ENV !== "production" && token.startsWith("dev-mock-")) {
      const parts = token.split(":");
      return {
        uid: parts[1] || "dev-student-uid",
        email: parts[2] || "student@icat.ac.in",
        name: parts[3] || "Cyber Agent",
        role: parts[4] || "student",
      };
    }
    console.error("Firebase Admin verifyIdToken error:", err);
    return null;
  }
}

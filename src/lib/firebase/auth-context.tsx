"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onIdTokenChanged,
} from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "./client";
import { UserProfile } from "../game-engine/types";
import { soundFx } from "../game-engine/sound-effects";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  idToken: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  selectTeam: (teamId: string, huntId?: string) => Promise<void>;
  devSignIn: (email: string, name: string, teamId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);

          // Listen to user profile document in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const unsubProfile = onSnapshot(
            userDocRef,
            async (snapshot) => {
              const localBackupTeam =
                typeof window !== "undefined"
                  ? localStorage.getItem(`user_team_${currentUser.uid}`)
                  : null;

              if (snapshot.exists()) {
                const data = snapshot.data() as UserProfile;
                if (!data.teamId && localBackupTeam) {
                  data.teamId = localBackupTeam;
                  setDoc(userDocRef, { teamId: localBackupTeam }, { merge: true }).catch(() => {});
                }
                setProfile(data);
              } else {
                // Create initial user profile
                const newProfile: UserProfile = {
                  uid: currentUser.uid,
                  name: currentUser.displayName || "Agent " + currentUser.uid.slice(0, 5),
                  email: currentUser.email || "",
                  photoURL: currentUser.photoURL || undefined,
                  teamId: localBackupTeam || undefined,
                  huntId: "icat-2026",
                  role: "student",
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                try {
                  await setDoc(userDocRef, newProfile);
                  setProfile(newProfile);
                } catch (e) {
                  console.warn("Could not write user profile to Firestore (using in-memory):", e);
                  setProfile(newProfile);
                }
              }
              setLoading(false);
            },
            (err) => {
              console.warn("Firestore profile snapshot error:", err);
              const localBackupTeam =
                typeof window !== "undefined"
                  ? localStorage.getItem(`user_team_${currentUser.uid}`)
                  : undefined;

              // Fallback profile from auth user
              setProfile({
                uid: currentUser.uid,
                name: currentUser.displayName || "Cyber Agent",
                email: currentUser.email || "",
                photoURL: currentUser.photoURL || undefined,
                teamId: localBackupTeam || undefined,
                huntId: "icat-2026",
                role: "student",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              setLoading(false);
            }
          );

          return () => unsubProfile();
        } catch (e) {
          console.error("Error getting idToken:", e);
          setLoading(false);
        }
      } else {
        // Check for local storage mock session (for dev/offline)
        const savedMock = typeof window !== "undefined" ? localStorage.getItem("cyber_dev_profile") : null;
        if (savedMock) {
          try {
            const parsed = JSON.parse(savedMock);
            setProfile(parsed);
            setIdToken(`dev-mock-:${parsed.uid}:${parsed.email}:${parsed.name}:${parsed.role}`);
          } catch {}
        } else {
          setProfile(null);
          setIdToken(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    soundFx.playClick();
    try {
      const res = await signInWithPopup(auth, googleProvider);
      soundFx.playAccessGranted();
      if (res.user) {
        setUser(res.user);
        const token = await res.user.getIdToken();
        setIdToken(token);
      }
    } catch (err: unknown) {
      soundFx.playAccessDenied();
      console.warn("Google Sign-in with Firebase failed (might need valid API keys):", err);
      // Create fallback dev mock user if in dev/offline
      if (process.env.NODE_ENV !== "production") {
        await devSignIn("player@icat.ac.in", "Agent Spartan");
      }
    }
  };

  const devSignIn = async (email: string, name: string, teamId?: string) => {
    soundFx.playClick();
    const uid = "mock-" + Math.random().toString(36).substring(2, 9);
    const mockProfile: UserProfile = {
      uid,
      name,
      email,
      teamId,
      huntId: "icat-2026",
      role: email.includes("admin") || email.includes("teacher") ? "admin" : "student",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("cyber_dev_profile", JSON.stringify(mockProfile));
    }
    setProfile(mockProfile);
    setIdToken(`dev-mock-:${uid}:${email}:${name}:${mockProfile.role}`);
    soundFx.playAccessGranted();
  };

  const signOutUser = async () => {
    soundFx.playClick();
    if (typeof window !== "undefined") {
      localStorage.removeItem("cyber_dev_profile");
    }
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setProfile(null);
    setIdToken(null);
  };

  const selectTeam = async (teamId: string, huntId: string = "icat-2026") => {
    soundFx.playClick();
    if (!profile) return;

    // Permanent Squad Lock: Once a student selects a team, they cannot re-select unless the game resets
    if (profile.teamId && profile.teamId !== "") {
      console.warn("Squad is permanently locked for this user profile.");
      return;
    }

    const updated: UserProfile = {
      ...profile,
      teamId,
      huntId,
      updatedAt: Date.now(),
    };

    setProfile(updated);

    if (user && user.uid) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`user_team_${user.uid}`, teamId);
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, updated, { merge: true });
      } catch (err) {
        console.warn("Could not persist team selection to Firestore:", err);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("cyber_dev_profile", JSON.stringify(updated));
    }

    // Call server endpoint to ensure teamProgress exists and is properly initialized
    try {
      await fetch("/api/game/team-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId,
          teamId,
        }),
      });
    } catch (e) {
      console.warn("Could not sync team-state with server API:", e);
    }

    soundFx.playAccessGranted();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        idToken,
        loading,
        signInWithGoogle,
        signOutUser,
        selectTeam,
        devSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

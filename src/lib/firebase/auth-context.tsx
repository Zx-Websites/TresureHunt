"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onIdTokenChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
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
          const unsubProfile = onSnapshot(userDocRef, async (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            } else {
              // Create initial user profile
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || "Agent " + currentUser.uid.slice(0, 5),
                email: currentUser.email || "",
                photoURL: currentUser.photoURL || undefined,
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
          }, (err) => {
            console.warn("Firestore profile snapshot error:", err);
            // Fallback profile from auth user
            setProfile({
              uid: currentUser.uid,
              name: currentUser.displayName || "Cyber Agent",
              email: currentUser.email || "",
              photoURL: currentUser.photoURL || undefined,
              role: "student",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            setLoading(false);
          });

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
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setIdToken(token);
      soundFx.playAccessGranted();
    } catch (err: unknown) {
      soundFx.playAccessDenied();
      console.warn("Google Sign-in with Firebase failed (might need valid API keys):", err);
      // If popup fails or dev mode is used, offer fallback
      throw err;
    } finally {
      setLoading(false);
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

    const updated: UserProfile = {
      ...profile,
      teamId,
      huntId,
      updatedAt: Date.now(),
    };

    setProfile(updated);

    if (user && user.uid) {
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
    } catch (err) {
      console.warn("Team state init call error:", err);
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

"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";

export function GoogleSignInButton() {
  const { signInWithGoogle, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.warn("Google Sign In exception:", err);
      setErrorMsg("Google Sign-In was interrupted. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Primary Google Auth Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full relative group overflow-hidden rounded-lg border-2 border-cyan-500/40 bg-gradient-to-r from-[#070B19] via-[#0D182E] to-[#070B19] p-4 text-center font-mono transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] active:scale-[0.99] disabled:opacity-50"
      >
        <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-center justify-center gap-3">
          {/* Google G Logo SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-1.9.4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
            />
          </svg>
          <span className="text-cyan-300 font-bold tracking-wider text-sm uppercase">
            {loading ? "INITIALIZING SECURE LINK..." : "SIGN IN WITH GOOGLE"}
          </span>
        </div>
      </button>

      {errorMsg && (
        <div className="rounded border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 font-mono">
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}

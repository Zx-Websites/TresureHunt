"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { CyberButton } from "../ui/CyberButton";
import { ShieldCheck, Terminal, UserCheck } from "lucide-react";

export function GoogleSignInButton() {
  const { signInWithGoogle, devSignIn, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devName, setDevName] = useState("");
  const [devEmail, setDevEmail] = useState("");

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.warn("Google Sign In exception:", err);
      setErrorMsg("Google Sign-In popup interrupted. You can also use Quick Agent Sign-In below for instant testing.");
    }
  };

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim()) return;
    const email = devEmail.trim() || `${devName.toLowerCase().replace(/\s+/g, "")}@icat.ac.in`;
    devSignIn(email, devName.trim());
    setShowDevModal(false);
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

      {/* Quick Agent Testing Mode (for offline or local dev without Google OAuth client setup) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowDevModal(!showDevModal)}
          className="text-xs font-mono text-slate-400 hover:text-cyan-400 underline underline-offset-4 transition-colors flex items-center justify-center gap-1.5 mx-auto"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Local Agent / Fast Login Options</span>
        </button>

        {showDevModal && (
          <form
            onSubmit={handleDevSubmit}
            className="mt-3 rounded-lg border border-cyan-500/30 bg-[#070B19]/95 p-4 space-y-3 font-mono text-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-semibold border-b border-slate-800 pb-2">
              <UserCheck className="w-4 h-4" />
              <span>AGENT IDENTITY SIMULATOR</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Agent Name</label>
              <input
                type="text"
                placeholder="e.g. Maya Lin"
                value={devName}
                onChange={(e) => setDevName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-cyan-200 focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="e.g. maya@icat.ac.in"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-cyan-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <CyberButton type="submit" variant="cyan" size="sm" className="flex-1">
                ACCESS SYSTEM
              </CyberButton>
              <CyberButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDevModal(false)}
              >
                CANCEL
              </CyberButton>
            </div>
          </form>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>FIREBASE AUTHENTICATION PROTOCOL ACTIVE</span>
      </div>
    </div>
  );
}

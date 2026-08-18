"use client";

import React, { useState, useEffect } from "react";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Radio,
} from "lucide-react";

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

const ADMIN_PASSWORD_HASH = "ZxAlpha98007!";

export function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingStorage, setCheckingStorage] = useState<boolean>(true);
  const [inputPassword, setInputPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem("admin_auth_session");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
    } catch {
      // Ignore storage errors
    } finally {
      setCheckingStorage(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setErrorMsg(null);

    if (inputPassword === ADMIN_PASSWORD_HASH) {
      soundFx.playAccessGranted();
      try {
        sessionStorage.setItem("admin_auth_session", "true");
      } catch {}
      setIsAuthenticated(true);
    } else {
      soundFx.playAccessDenied();
      setErrorMsg("ACCESS DENIED: Invalid Administrator Security Passcode.");
      setInputPassword("");
    }
  };

  const handleLogout = () => {
    soundFx.playClick();
    try {
      sessionStorage.removeItem("admin_auth_session");
    } catch {}
    setIsAuthenticated(false);
    setInputPassword("");
  };

  if (checkingStorage) {
    return (
      <div className="min-h-screen bg-[#04070F] text-cyan-400 flex items-center justify-center font-mono">
        <div className="animate-pulse">VERIFYING SECURITY PROTOCOLS...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#04070F] text-slate-100 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 text-center relative z-10 animate-in zoom-in-95">
          {/* Emblem */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border-2 border-amber-400 bg-amber-950/40 text-amber-300 text-3xl shadow-[0_0_35px_rgba(255,184,0,0.4)] mx-auto animate-pulse">
            <Lock className="w-10 h-10 text-amber-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-400 text-xs tracking-widest uppercase">
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span>CLASSIFIED ADMIN AREA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-100 uppercase">
              ORGANIZER ACCESS PORTAL
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Protected by ICAT 2026 High-Level Encryption. Enter your security passcode to proceed.
            </p>
          </div>

          <CyberCard className="p-6 border-amber-500/40 bg-[#070B19]/90 space-y-4 text-left">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Security Passcode</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter security key..."
                    required
                    autoFocus
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <CyberButton
                type="submit"
                variant="amber"
                size="md"
                className="w-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,184,0,0.3)]"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                UNLOCK ADMIN CONTROL CENTER
              </CyberButton>
            </form>
          </CyberCard>

          <p className="text-[11px] text-slate-500">
            Authorized ICAT Faculty & Game Arbiters Only
          </p>
        </div>
      </main>
    );
  }

  return (
    <div>
      {/* Admin Session Banner with Lock Button */}
      <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 font-mono text-xs flex items-center justify-between text-amber-300">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold">ADMIN SESSION ACTIVE (SECURITY LEVEL 5)</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-[11px] px-2.5 py-0.5 rounded border border-amber-500/40 hover:bg-amber-900/50 text-amber-200 flex items-center gap-1 transition-all"
        >
          <Lock className="w-3 h-3" />
          <span>LOCK ADMIN SESSION</span>
        </button>
      </div>

      {children}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Radio,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";

interface AdminPasswordGateProps {
  children: React.ReactNode;
}

const ADMIN_PASSWORD_HASH = "ZxAlpha98007!";

export function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const savedAuth = sessionStorage.getItem("admin_auth_session");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
    } catch {
      // Ignore sessionStorage exceptions
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

  // If not authenticated or during initial load, show the styled Password Input Gate
  if (!isAuthenticated || !mounted) {
    return (
      <main className="min-h-screen bg-[#04070F] text-slate-100 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        {/* Ambient Glow */}
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
              Protected by ICAT 2026 High-Level Encryption. Enter the security passcode to proceed.
            </p>
          </div>

          <CyberCard className="p-6 border-amber-500/40 space-y-4 shadow-[0_0_30px_rgba(255,184,0,0.15)]">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs text-amber-300 font-bold tracking-wider flex items-center justify-between">
                  <span>ENTER ADMIN PASSCODE</span>
                  <span className="text-[10px] text-slate-500 font-normal">REQUIRED</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Enter Security Passcode..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-amber-500/40 bg-black/60 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in shake text-left">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <CyberButton
                type="submit"
                variant="amber"
                size="md"
                className="w-full font-bold tracking-wider"
              >
                UNLOCK MISSION CONTROL
              </CyberButton>
            </form>
          </CyberCard>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
            <Link href="/" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Player HUD</span>
            </Link>
            <span>•</span>
            <Link href="/track" className="hover:text-cyan-300 transition-colors">
              Open /track Wall
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Once authenticated, render children with top Lock indicator
  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/50 bg-amber-950/90 text-amber-300 hover:bg-amber-900 text-xs font-bold font-mono shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>LOCK ADMIN SESSION</span>
        </button>
      </div>
      {children}
    </div>
  );
}

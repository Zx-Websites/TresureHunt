"use client";

import React, { useState } from "react";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface QuickSeederProps {
  idToken?: string | null;
  onSeeded?: () => void;
}

export function QuickSeeder({ idToken, onSeeded }: QuickSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [resetTeams, setResetTeams] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSeedData = async () => {
    soundFx.playClick();
    setIsSeeding(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/game/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": "ZxAlpha98007!",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: "icat-2026",
          resetTeams,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({ type: "success", text: data.message });
        if (onSeeded) onSeeded();
      } else {
        soundFx.playAccessDenied();
        setStatusMsg({ type: "error", text: data.error || "Seeding failed." });
      }
    } catch {
      soundFx.playAccessDenied();
      setStatusMsg({ type: "error", text: "Network connection error while seeding." });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <CyberCard className="p-6 space-y-4 border-cyan-500/40 font-mono">
      <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-800 pb-3">
        <Database className="w-5 h-5" />
        <div>
          <h3 className="font-black text-base text-slate-100 uppercase tracking-wider">
            FIRESTORE DATA SEEDER & CONFIGURATION
          </h3>
          <p className="text-xs text-slate-400">Initialize ICAT Bangalore 2026 Hunt blueprints & secrets</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <p>
          Populate all 5 floors, starting room 202, Boss sector 401A, routes P1/P2/P3, and server secrets into Firestore database collections.
        </p>

        <label className="flex items-center gap-2 text-slate-400 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={resetTeams}
            onChange={(e) => setResetTeams(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
          />
          <span>Also reset all 5 squad progression states (RED, WHITE, BLACK, CYAN, BLUE)</span>
        </label>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 p-3 rounded text-xs border ${
            statusMsg.type === "success"
              ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
              : "border-rose-500/50 bg-rose-950/60 text-rose-300"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <CyberButton
        onClick={handleSeedData}
        loading={isSeeding}
        variant="cyan"
        size="md"
        className="w-full"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        SEED ICAT 2026 CONFIGURATION INTO FIRESTORE
      </CyberButton>
    </CyberCard>
  );
}

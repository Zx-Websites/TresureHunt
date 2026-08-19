"use client";

import React, { useState } from "react";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Zap, Trash2 } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface QuickSeederProps {
  idToken?: string | null;
  onSeeded?: () => void;
}

export function QuickSeeder({ idToken, onSeeded }: QuickSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [resetTeams, setResetTeams] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Safe reset: Resets team positions / scores, preserves custom rooms
  const handleResetGameSession = async () => {
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
          resetTeams: true,
          hardResetAllRooms: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({ type: "success", text: data.message });
        if (onSeeded) onSeeded();
      } else {
        soundFx.playAccessDenied();
        setStatusMsg({ type: "error", text: data.error || "Reset failed." });
      }
    } catch {
      soundFx.playAccessDenied();
      setStatusMsg({ type: "error", text: "Network error while resetting game session." });
    } finally {
      setIsSeeding(false);
    }
  };

  // Factory reset: Hard reset to baseline defaults
  const handleFactoryReset = async () => {
    if (
      !confirm(
        "⚠️ DANGER: Are you sure you want to perform a FACTORY HARD RESET? This will delete all custom rooms, custom riddles, and custom ciphers, and restore baseline blueprints."
      )
    ) {
      return;
    }

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
          resetTeams: true,
          hardResetAllRooms: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({ type: "success", text: "Factory blueprints restored. All custom rooms reset." });
        if (onSeeded) onSeeded();
      } else {
        soundFx.playAccessDenied();
        setStatusMsg({ type: "error", text: data.error || "Factory reset failed." });
      }
    } catch {
      soundFx.playAccessDenied();
      setStatusMsg({ type: "error", text: "Network error during factory reset." });
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
            GAME SESSION & EVENT CONTROLLER
          </h3>
          <p className="text-xs text-slate-400">Reset squad runs without losing custom rooms or riddles</p>
        </div>
      </div>

      <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
        <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
        <span>
          <strong>REALTIME AUTO-SAVE ACTIVE:</strong> Edits in the Path Studio above are automatically synced to Cloud Firestore. No manual save button is needed.
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <p>
          Reset all 5 squad progressions back to Stage 1 (Room 202), clear pieces and boss records, and unlock player team logins for a fresh competition run.
        </p>
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

      <div className="space-y-2 pt-1">
        <CyberButton
          onClick={handleResetGameSession}
          loading={isSeeding}
          variant="cyan"
          size="md"
          className="w-full font-bold"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          RESET SQUAD RUNS (PRESERVES CUSTOM ROOMS)
        </CyberButton>

        <button
          onClick={handleFactoryReset}
          disabled={isSeeding}
          className="w-full text-center text-[11px] text-rose-400 hover:text-rose-300 py-1.5 transition-colors flex items-center justify-center gap-1 opacity-70 hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
          <span>Factory Reset: Overwrite all with default template</span>
        </button>
      </div>
    </CyberCard>
  );
}

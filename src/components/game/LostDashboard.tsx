"use client";

import React from "react";
import { TeamProgress, Hunt } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import {
  Skull,
  AlertTriangle,
  Lock,
  Radio,
  Flame,
  ShieldAlert,
} from "lucide-react";

interface LostDashboardProps {
  progress: TeamProgress;
  hunt: Hunt;
}

export function LostDashboard({ progress, hunt }: LostDashboardProps) {
  const team = hunt.teams[progress.teamId];
  const isDisqualified = progress.status === "disqualified";

  return (
    <main className="min-h-screen bg-[#03050C] text-slate-100 flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Red Ambient Alarm Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 text-center relative z-10 animate-in zoom-in-95">
        {/* Pulsing Alarm Beacon */}
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl border-2 border-rose-500 bg-rose-950/60 text-rose-400 text-4xl shadow-[0_0_50px_rgba(244,63,94,0.6)] mx-auto animate-bounce">
          {isDisqualified ? <ShieldAlert className="w-12 h-12" /> : <Skull className="w-12 h-12" />}
        </div>

        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/50 bg-rose-950/70 text-rose-300 text-xs tracking-widest uppercase">
            <Radio className="w-3.5 h-3.5 animate-ping text-rose-400" />
            <span>{isDisqualified ? "SQUAD DISQUALIFIED" : "COMPETITION TERMINATION"}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-rose-400 uppercase drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]">
            YOU LOST
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto leading-relaxed">
            {progress.loserReason ||
              (isDisqualified
                ? "Your squad has been disqualified from the hunt by the Event Arbiter."
                : "Another squad has claimed the treasure or all 18 puzzle fragments have been retrieved. Mission over.")}
          </p>
        </div>

        {/* Squad Telemetry Summary Card */}
        <CyberCard className="p-5 border-rose-500/40 bg-[#070914]/90 space-y-3 text-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
            <span className="text-slate-400 font-bold">SQUAD IDENTIFIER</span>
            <span className="font-black text-rose-400">{team?.name || progress.teamId}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded bg-black/40 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">SECTORS CLEARED</span>
              <span className="text-sm font-black text-slate-300">
                {progress.completedNodes?.length || 0} SECTORS
              </span>
            </div>

            <div className="p-2.5 rounded bg-black/40 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">FRAGMENTS RETRIEVED</span>
              <span className="text-sm font-black text-slate-300">
                {progress.collectedPieces?.length || 0} / 6 PIECES
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/30 text-xs text-rose-200 flex items-start gap-2 pt-2">
            <Lock className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">
              Terminal Locked: All riddle decryption and code submissions are permanently disabled for your squad until the administrator resets the event.
            </p>
          </div>
        </CyberCard>

        <p className="text-[11px] text-slate-500 font-mono">
          ICAT Bangalore Treasure Hunt 2026 — Mainframe Security Protocol
        </p>
      </div>
    </main>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { SoundToggle } from "../ui/SoundToggle";
import { LogOut, Puzzle, Shield, Activity, ShieldAlert } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface CyberHeaderProps {
  hunt: Hunt;
  progress: TeamProgress | null;
  onOpenPuzzleDrawer?: () => void;
}

export function CyberHeader({
  hunt,
  progress,
  onOpenPuzzleDrawer,
}: CyberHeaderProps) {
  const { profile, signOutUser } = useAuth();

  const team = progress?.teamId ? hunt.teams[progress.teamId] : null;
  const route = progress?.routeId ? hunt.routes[progress.routeId] : null;

  const totalRouteNodes = route?.nodes?.length || Object.keys(hunt.nodes).length;
  const completedCount = progress?.completedNodes?.length || 0;
  const progressPercent = Math.min(100, Math.round((completedCount / Math.max(1, totalRouteNodes)) * 100));

  const collectedPiecesCount = progress?.collectedPieces?.length || 0;

  const handlePuzzleClick = () => {
    soundFx.playClick();
    if (onOpenPuzzleDrawer) onOpenPuzzleDrawer();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-cyan-950/80 bg-[#050811]/90 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Logo & Hunt Info */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-9 w-9 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 font-mono font-black text-base shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <span className="animate-pulse">◈</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono font-black text-sm sm:text-base text-slate-100 tracking-wider uppercase">
                {hunt.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            {team && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: team.hex }} />
                <span className="font-bold" style={{ color: team.hex }}>{team.name}</span>
                <span className="text-slate-400">|</span>
                <span className="text-cyan-400">Route {team.routeId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Progression & Physical Pieces Telemetry */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          {/* Progress Bar */}
          <div className="hidden md:flex flex-col gap-1 w-36">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>SYSTEM PROGRESS</span>
              <span className="text-cyan-300 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Physical Cache Button */}
          <button
            onClick={handlePuzzleClick}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
          >
            <Puzzle className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">{collectedPiecesCount} / 6 PIECES</span>
          </button>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2">
          <SoundToggle />

          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-950/60 text-xs font-mono transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">ADMIN</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-mono font-bold text-slate-200 truncate max-w-[120px]">
                {profile?.name || "Agent"}
              </p>
              <p className="text-[10px] font-mono text-cyan-400 uppercase">
                {profile?.role || "Student"}
              </p>
            </div>

            <button
              onClick={() => signOutUser()}
              title="Sign Out"
              className="p-2 rounded border border-slate-800 bg-[#070B19] text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

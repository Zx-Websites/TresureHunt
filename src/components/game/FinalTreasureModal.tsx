"use client";

import React, { useEffect } from "react";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import { Trophy, Award, Sparkles, X, CheckCircle2 } from "lucide-react";

interface FinalTreasureModalProps {
  hunt: Hunt;
  progress: TeamProgress;
  onClose: () => void;
}

export function FinalTreasureModal({
  hunt,
  progress,
  onClose,
}: FinalTreasureModalProps) {
  useEffect(() => {
    soundFx.playVictoryFanfare();

    // Trigger celebratory cyber particle confetti dynamically
    import("canvas-confetti").then((confettiModule) => {
      const confetti = confettiModule.default || confettiModule;
      const end = Date.now() + 3.5 * 1000;
      const colors = ["#00f0ff", "#ff007f", "#00ff9d", "#ffb800"];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }).catch(() => {});
  }, []);

  const treasure = hunt.treasure;
  const team = hunt.teams[progress.teamId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in zoom-in-95">
      <CyberCard className="w-full max-w-xl p-6 sm:p-8 space-y-6 border-yellow-400/90 shadow-[0_0_60px_rgba(250,204,21,0.4)] text-center font-mono relative overflow-hidden">
        {/* Shimmering Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shadow-[0_0_15px_#facc15]" />

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trophy Emblem */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl border-2 border-yellow-400 bg-yellow-950/60 text-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-bounce">
            <Trophy className="w-10 h-10" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-200 animate-spin" />
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full border border-yellow-500/40 bg-yellow-950/50 text-yellow-300 text-xs font-black tracking-widest uppercase">
            MASTER CYBER VAULT UNLOCKED
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 uppercase tracking-wide">
            {treasure.title}
          </h1>
          {team && (
            <p className="text-sm font-bold" style={{ color: team.hex }}>
              VICTORY FOR SQUAD: {team.name} [{team.id}]
            </p>
          )}
        </div>

        {/* Master Clue Card */}
        <div className="p-5 rounded-xl border border-yellow-500/40 bg-[#050811] space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider block">
              FINAL TREASURE DIRECTIVE:
            </span>
            <p className="text-sm sm:text-base text-slate-200 italic font-sans leading-relaxed">
              &quot;{treasure.clue}&quot;
            </p>
          </div>

          {treasure.hint && (
            <div className="p-3 rounded bg-yellow-950/30 border border-yellow-500/20 text-xs text-yellow-200 space-y-1">
              <span className="font-bold text-yellow-400">TACTICAL INSTRUCTION:</span>
              <p>{treasure.hint}</p>
            </div>
          )}

          {treasure.finalMessage && (
            <p className="text-xs text-emerald-400 font-bold text-center pt-2 border-t border-slate-800">
              {treasure.finalMessage}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3 rounded border border-slate-800 bg-slate-950/60 text-slate-300">
            <span className="text-slate-400 block text-[10px]">TOTAL SECTORS CLEARED</span>
            <span className="text-lg font-black text-cyan-400">
              {progress.completedNodes.length} / {Object.keys(hunt.nodes).length}
            </span>
          </div>
          <div className="p-3 rounded border border-slate-800 bg-slate-950/60 text-slate-300">
            <span className="text-slate-400 block text-[10px]">PHYSICAL FRAGMENTS</span>
            <span className="text-lg font-black text-emerald-400">
              {progress.collectedPieces.length} COLLECTED
            </span>
          </div>
        </div>

        <CyberButton
          onClick={onClose}
          variant="amber"
          size="lg"
          className="w-full text-slate-950 font-black tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.5)]"
        >
          CLAIM VICTORY PROTOCOL
        </CyberButton>
      </CyberCard>
    </div>
  );
}

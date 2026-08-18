"use client";

import React, { useState } from "react";
import { ClientHuntNode } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { CodeInputTerminal } from "./CodeInputTerminal";
import { BossMinigameModal } from "./BossMinigameModal";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  X,
  HelpCircle,
  Puzzle,
  Gamepad2,
  UserCheck,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

interface NodeDetailsModalProps {
  node: ClientHuntNode;
  onClose: () => void;
  isSubmittingCode: boolean;
  onSubmitCode: (nodeId: string, code: string) => Promise<{ success: boolean; message: string; puzzleLocation?: unknown }>;
  onSubmitMinigame: (nodeId: string, score: number) => Promise<{
    success: boolean;
    passed: boolean;
    code?: string;
    message: string;
  }>;
}

export function NodeDetailsModal({
  node,
  onClose,
  isSubmittingCode,
  onSubmitCode,
  onSubmitMinigame,
}: NodeDetailsModalProps) {
  const [showHint, setShowHint] = useState(false);
  const [showBossMinigame, setShowBossMinigame] = useState(false);
  const [injectedCode, setInjectedCode] = useState<string>("");

  const isCompleted = node.state === "COMPLETED";
  const isBoss = node.type === "BOSS";

  const codeSourceBadges = {
    TEACHER: {
      label: "FACULTY CLEARANCE",
      desc: "Present clearance to designated instructor in this room to receive the code.",
      icon: UserCheck,
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40",
    },
    HIDDEN: {
      label: "PHYSICAL TOKEN SEARCH",
      desc: "Cipher is hidden somewhere in plain sight inside this classroom. Search the physical room!",
      icon: Search,
      color: "text-pink-400 border-pink-500/40 bg-pink-950/40",
    },
    MINIGAME: {
      label: "NEURAL OVERRIDE",
      desc: "Breach mainframe defense in the minigame to decrypt the clearance cipher.",
      icon: Gamepad2,
      color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
    },
  };

  const currentBadge = node.codeSource ? codeSourceBadges[node.codeSource] : codeSourceBadges.HIDDEN;
  const BadgeIcon = currentBadge.icon;

  const handleToggleHint = () => {
    soundFx.playClick();
    setShowHint(!showHint);
  };

  const handleCodeSubmit = async (code: string) => {
    return await onSubmitCode(node.id, code);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <CyberCard className="w-full max-w-lg p-6 space-y-5 border-cyan-500/80 shadow-[0_0_35px_rgba(0,240,255,0.25)] max-h-[90vh] overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/40 font-mono text-xs font-bold text-cyan-300">
                {isCompleted ? `SECTOR: ${node.name}` : isBoss ? "BOSS SECTOR 401A" : "MISSION OBJECTIVE: DECODE RIDDLE"}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold border border-emerald-500/40 bg-emerald-950/60 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  CLEARED
                </span>
              )}
              {isBoss && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold border border-amber-500/40 bg-amber-950/60 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  MAINFRAME BOSS
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Riddle Heading & Clue Badge */}
          <div className="space-y-2 font-mono">
            <h2 className="text-xl font-black text-slate-100 tracking-wide">
              {isCompleted ? `${node.name} [CLEARED]` : node.riddle?.title || "Encrypted Navigation Clue"}
            </h2>

            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-semibold ${currentBadge.color}`}>
              <BadgeIcon className="w-4 h-4" />
              <span>{currentBadge.label}</span>
            </div>
            <p className="text-[11px] text-slate-400">{currentBadge.desc}</p>
          </div>

          {/* Riddle / Clue Terminal Container */}
          <div className="rounded-lg border border-cyan-500/30 bg-[#050811] p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold border-b border-slate-800 pb-2">
              <span>{node.riddle?.title || "DECRYPTED SECTOR RIDDLE"}</span>
              <span className="text-[10px] text-slate-400">DATA FEED 2026</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed italic">
              &quot;{node.riddle?.text || "Investigate the sector coordinates to locate the physical token."}&quot;
            </p>

            {/* Hint Accordion */}
            {node.riddle?.hint && (
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={handleToggleHint}
                  className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-cyan-300 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showHint ? "HIDE TACTICAL HINT" : "REVEAL TACTICAL HINT"}</span>
                  </span>
                  {showHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHint && (
                  <div className="mt-2 p-2.5 rounded bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 animate-in fade-in">
                    {node.riddle.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boss Encounter Minigame Launcher & Unity Station Guidance */}
          {isBoss && !isCompleted && node.codeSource === "MINIGAME" && (
            <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-950/30 space-y-3 font-mono text-center">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                <Gamepad2 className="w-4 h-4" />
                <span>UNITY MAINFRAME ENCOUNTER</span>
              </div>
              <p className="text-xs text-amber-200">
                Play the Unity arcade station in Room 401A. Score <span className="font-bold">{node.minigame?.minimumScore || 850}+ PTS</span> to decrypt your clearance cipher.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <CyberButton
                  onClick={() => setShowBossMinigame(true)}
                  variant="amber"
                  size="sm"
                  className="flex-1"
                >
                  <Gamepad2 className="w-3.5 h-3.5 mr-1.5" />
                  PLAY WEB OVERRIDE TEST
                </CyberButton>
              </div>
            </div>
          )}

          {/* Physical Puzzle Clue (Revealed upon completion) */}
          {isCompleted && node.puzzleLocation && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-2 font-mono">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Puzzle className="w-4 h-4" />
                <span>PHYSICAL CACHE UNCOVERED</span>
              </div>
              <p className="text-xs text-emerald-200">
                {node.puzzleLocation.clue}
              </p>
              {node.puzzleLocation.hint && (
                <p className="text-[11px] text-emerald-400 italic">
                  Hint: {node.puzzleLocation.hint}
                </p>
              )}
            </div>
          )}

          {/* Keycode Submission Terminal */}
          {!isCompleted && (
            <div className="pt-2">
              <CodeInputTerminal
                nodeId={node.id}
                isSubmitting={isSubmittingCode}
                onSubmitCode={handleCodeSubmit}
              />
            </div>
          )}
        </CyberCard>
      </div>

      {/* Boss Minigame Modal */}
      {showBossMinigame && (
        <BossMinigameModal
          node={node}
          onClose={() => setShowBossMinigame(false)}
          onSubmitMinigame={onSubmitMinigame}
          onAutoFillCode={(code) => setInjectedCode(code)}
        />
      )}
    </>
  );
}

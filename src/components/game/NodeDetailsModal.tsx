"use client";

import React, { useState } from "react";
import { ClientHuntNode, TeamProgress } from "@/lib/game-engine/types";
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
  ArrowRight,
  Sparkles,
  MapPin,
} from "lucide-react";

interface NodeDetailsModalProps {
  node: ClientHuntNode;
  progress?: TeamProgress | null;
  onClose: () => void;
  isSubmittingCode: boolean;
  onSubmitCode: (nodeId: string, code: string) => Promise<{ success: boolean; message: string; puzzleLocation?: { clue: string; hint?: string; pieceId?: string } | null }>;
  onSubmitMinigame: (nodeId: string, score: number) => Promise<{
    success: boolean;
    passed: boolean;
    code?: string;
    message: string;
  }>;
  onCollectPiece?: (pieceId: string) => Promise<boolean>;
}

export function NodeDetailsModal({
  node,
  progress,
  onClose,
  isSubmittingCode,
  onSubmitCode,
  onSubmitMinigame,
  onCollectPiece,
}: NodeDetailsModalProps) {
  const [showHint, setShowHint] = useState(false);
  const [showBossMinigame, setShowBossMinigame] = useState(false);
  const [injectedCode, setInjectedCode] = useState<string>("");

  // Post-unlock success & puzzle confirmation flow
  const [isUnlockedSuccess, setIsUnlockedSuccess] = useState(false);
  const [unlockedRoomName, setUnlockedRoomName] = useState(node.name);
  const [unlockedPuzzleLocation, setUnlockedPuzzleLocation] = useState<{ clue: string; hint?: string; pieceId?: string } | null>(
    node.puzzleLocation || null
  );
  const [isPieceCollectedLocally, setIsPieceCollectedLocally] = useState(
    node.puzzleLocation?.pieceId ? progress?.collectedPieces?.includes(node.puzzleLocation.pieceId) : false
  );
  const [isCollectingPiece, setIsCollectingPiece] = useState(false);

  const isCompleted = node.state === "COMPLETED" || isUnlockedSuccess;
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
    const result = await onSubmitCode(node.id, code);
    if (result.success) {
      soundFx.playAccessGranted();
      setIsUnlockedSuccess(true);
      if (result.puzzleLocation) {
        setUnlockedPuzzleLocation(result.puzzleLocation);
      }
    }
    return result;
  };

  const handleConfirmPieceCollection = async () => {
    const pieceId = unlockedPuzzleLocation?.pieceId || node.puzzleLocation?.pieceId;
    if (!pieceId || !onCollectPiece) return;

    soundFx.playClick();
    setIsCollectingPiece(true);
    try {
      const ok = await onCollectPiece(pieceId);
      if (ok) {
        soundFx.playAccessGranted();
        setIsPieceCollectedLocally(true);
      }
    } finally {
      setIsCollectingPiece(false);
    }
  };

  const handleProceedToNext = () => {
    soundFx.playNodeSelect();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in font-mono">
        <CyberCard className="w-full max-w-lg p-6 space-y-5 border-cyan-500/80 shadow-[0_0_40px_rgba(0,240,255,0.3)] max-h-[90vh] overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/40 text-xs font-bold text-cyan-300">
                {isCompleted
                  ? `CLEARED: ${node.name}`
                  : isBoss
                  ? "BOSS SECTOR 401A"
                  : "ACTIVE RIDDLE MISSION"}
              </span>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/40 bg-emerald-950/60 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ACCESS GRANTED
                </span>
              )}

              {isBoss && !isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/40 bg-amber-950/60 text-amber-300">
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

          {/* STEP 1: Riddle Clue Display */}
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100 tracking-wide">
              {isCompleted ? `${node.name} [CLEARED]` : node.riddle?.title || "Encrypted Navigation Clue"}
            </h2>

            {!isCompleted && (
              <>
                <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-semibold ${currentBadge.color}`}>
                  <BadgeIcon className="w-4 h-4" />
                  <span>{currentBadge.label}</span>
                </div>
                <p className="text-[11px] text-slate-400">{currentBadge.desc}</p>
              </>
            )}
          </div>

          {/* Riddle / Clue Terminal Container */}
          <div className="rounded-lg border border-cyan-500/30 bg-[#050811] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold border-b border-slate-800 pb-2">
              <span>{isCompleted ? "TRANSMISSION ARCHIVE" : node.riddle?.title || "DECRYPTED SECTOR RIDDLE"}</span>
              <span className="text-[10px] text-slate-400">DATA FEED 2026</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed italic">
              &quot;{node.riddle?.text || "Investigate the sector coordinates to locate the physical token."}&quot;
            </p>

            {/* Hint Accordion (Only before completion) */}
            {!isCompleted && node.riddle?.hint && (
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

          {/* Boss Encounter Minigame Launcher */}
          {isBoss && !isCompleted && node.codeSource === "MINIGAME" && (
            <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-950/30 space-y-3 text-center">
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

          {/* STEP 2: Code Input Terminal (If not completed) */}
          {!isCompleted && (
            <div className="pt-2">
              <CodeInputTerminal
                nodeId={node.id}
                isSubmitting={isSubmittingCode}
                onSubmitCode={handleCodeSubmit}
              />
            </div>
          )}

          {/* STEP 3: Post-Unlock Physical Fragment Discovery & Confirmation */}
          {isCompleted && (
            <div className="space-y-4 pt-2 animate-in zoom-in-95">
              {/* If Stage Has A Physical Fragment (Stages 2 to 7) */}
              {unlockedPuzzleLocation || node.puzzleLocation ? (
                <div className="rounded-xl border-2 border-emerald-400/80 bg-emerald-950/50 p-5 space-y-4 shadow-[0_0_25px_rgba(0,255,157,0.3)]">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <Puzzle className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <span>PHYSICAL FRAGMENT UNCOVERED!</span>
                    </div>

                    {isPieceCollectedLocally ? (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        IN SQUAD BAG
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-xs font-bold border border-amber-500/50 animate-pulse flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        RETRIEVE PIECE NOW
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-emerald-100 leading-relaxed font-semibold">
                      {(unlockedPuzzleLocation || node.puzzleLocation)?.clue}
                    </p>
                    {(unlockedPuzzleLocation || node.puzzleLocation)?.hint && (
                      <p className="text-[11px] text-emerald-300/80 italic">
                        💡 Hint: {(unlockedPuzzleLocation || node.puzzleLocation)?.hint}
                      </p>
                    )}
                  </div>

                  {/* Confirm Piece Button */}
                  {!isPieceCollectedLocally ? (
                    <CyberButton
                      onClick={handleConfirmPieceCollection}
                      loading={isCollectingPiece}
                      variant="green"
                      size="md"
                      className="w-full font-bold shadow-[0_0_20px_rgba(0,255,157,0.4)]"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      CONFIRM GOT THE PUZZLE PIECE
                    </CyberButton>
                  ) : (
                    <div className="p-2.5 rounded bg-emerald-900/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Physical Fragment safely verified in your squad pouch!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-300">
                    SECTOR CLEARED SUCCESSFULLY
                  </p>
                  <p className="text-[11px] text-slate-400">
                    No physical fragment at this stage. Proceed along your squad route!
                  </p>
                </div>
              )}

              {/* Next Stage Button */}
              <CyberButton
                onClick={handleProceedToNext}
                variant="cyan"
                size="lg"
                className="w-full font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.4)]"
              >
                <span>PROCEED TO NEXT STAGE</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </CyberButton>
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

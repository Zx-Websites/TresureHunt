"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ClientHuntNode } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  AlertTriangle,
  X,
  Zap,
  Timer,
  Award,
  KeyRound,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface BossMinigameModalProps {
  node: ClientHuntNode;
  onClose: () => void;
  onSubmitMinigame: (nodeId: string, score: number) => Promise<{
    success: boolean;
    passed: boolean;
    code?: string;
    message: string;
  }>;
  onAutoFillCode: (code: string) => void;
}

export function BossMinigameModal({
  node,
  onClose,
  onSubmitMinigame,
  onAutoFillCode,
}: BossMinigameModalProps) {
  const minScore = node.minigame?.minimumScore || 850;

  const [gameState, setGameState] = useState<"READY" | "PLAYING" | "FINISHED">("READY");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [combo, setCombo] = useState(1);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [targetType, setTargetType] = useState<"CYAN" | "MAGENTA" | "GREEN">("CYAN");
  const [awardedCode, setAwardedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>("");

  // Start game
  const startGame = () => {
    soundFx.playBossAlert();
    setScore(0);
    setTimeLeft(25);
    setCombo(1);
    setGameState("PLAYING");
    spawnTarget();
  };

  const spawnTarget = useCallback(() => {
    const nextCell = Math.floor(Math.random() * 9);
    const types: ("CYAN" | "MAGENTA" | "GREEN")[] = ["CYAN", "MAGENTA", "GREEN"];
    const nextType = types[Math.floor(Math.random() * types.length)];
    setActiveCell(nextCell);
    setTargetType(nextType);
  }, []);

  // Timer loop
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score]);

  const finishGame = async () => {
    setGameState("FINISHED");
    setIsSubmitting(true);

    try {
      const res = await onSubmitMinigame(node.id, score);
      setResultMessage(res.message);
      if (res.passed && res.code) {
        setAwardedCode(res.code);
        soundFx.playAccessGranted();
      } else {
        soundFx.playAccessDenied();
      }
    } catch {
      setResultMessage("Failed to transmit override score to security server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCellClick = (index: number) => {
    if (gameState !== "PLAYING") return;

    if (index === activeCell) {
      soundFx.playClick();
      const points = 100 * combo;
      setScore((prev) => prev + points);
      setCombo((prev) => Math.min(prev + 1, 4));
      spawnTarget();
    } else {
      soundFx.playAccessDenied();
      setCombo(1);
    }
  };

  const handleUseCode = () => {
    if (awardedCode) {
      onAutoFillCode(awardedCode);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <CyberCard className="w-full max-w-lg p-6 space-y-5 border-amber-500/80 shadow-[0_0_40px_rgba(255,184,0,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-6 h-6 animate-pulse text-amber-400" />
            <div>
              <h2 className="font-mono font-black text-lg text-slate-100 uppercase tracking-wider">
                {node.minigame?.title || "NEURAL MATRIX OVERRIDE"}
              </h2>
              <p className="text-[11px] font-mono text-amber-300">
                BOSS SECTOR {node.id} // THRESHOLD: {minScore} PTS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* READY STATE */}
        {gameState === "READY" && (
          <div className="space-y-4 font-mono text-center py-4">
            <div className="p-4 rounded border border-slate-800 bg-[#050811] space-y-2 text-xs text-slate-300">
              <p className="text-sm font-bold text-amber-400">MISSION DIRECTIVE:</p>
              <p>
                Breach the cyber defense mainframe by overriding flashing neural frequency nodes on the grid before the time limit expires.
              </p>
              <p className="text-cyan-300 font-bold">
                REQUIRED SCORE: {minScore} PTS
              </p>
            </div>

            <CyberButton
              onClick={startGame}
              variant="amber"
              size="lg"
              className="w-full text-amber-950 font-black tracking-widest"
            >
              INITIALIZE NEURAL BREACH
            </CyberButton>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "PLAYING" && (
          <div className="space-y-4">
            {/* Live Stats */}
            <div className="flex items-center justify-between font-mono text-xs p-3 rounded bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Zap className="w-4 h-4" />
                <span className="font-bold">SCORE: {score}</span>
              </div>
              <div className="text-pink-400 font-bold">
                COMBO: x{combo}
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Timer className="w-4 h-4" />
                <span className="font-bold font-mono text-sm">{timeLeft}s</span>
              </div>
            </div>

            {/* 3x3 Matrix Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-amber-500/30 bg-[#050811]">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                const isActive = activeCell === index;
                const cellStyles = {
                  CYAN: "border-cyan-400 bg-cyan-950/80 shadow-[0_0_20px_#00f0ff] text-cyan-300",
                  MAGENTA: "border-pink-400 bg-pink-950/80 shadow-[0_0_20px_#ff007f] text-pink-300",
                  GREEN: "border-emerald-400 bg-emerald-950/80 shadow-[0_0_20px_#00ff9d] text-emerald-300",
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    className={`h-20 sm:h-24 rounded-lg border-2 font-mono font-black text-lg transition-all duration-100 flex items-center justify-center ${
                      isActive
                        ? `${cellStyles[targetType]} scale-105 animate-pulse`
                        : "border-slate-800 bg-slate-950/60 text-slate-700 hover:border-slate-700 active:scale-95"
                    }`}
                  >
                    {isActive ? (
                      <span className="flex flex-col items-center gap-1">
                        <Zap className="w-6 h-6" />
                        <span className="text-[10px] font-mono tracking-widest">BREACH</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">0x{index}F</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "FINISHED" && (
          <div className="space-y-4 font-mono text-center py-3">
            <div className="p-4 rounded-lg border border-slate-800 bg-[#050811] space-y-3">
              <div className="flex items-center justify-center">
                {score >= minScore ? (
                  <div className="p-3 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-400 shadow-[0_0_25px_#00ff9d]">
                    <Award className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-rose-950/80 border border-rose-400 text-rose-400 shadow-[0_0_25px_#ff2a55]">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}
              </div>

              <h3 className="font-black text-lg text-slate-100">
                FINAL SCORE: <span className="text-cyan-400">{score} PTS</span>
              </h3>
              <p className="text-xs text-slate-400">{resultMessage}</p>

              {awardedCode && (
                <div className="p-4 rounded-lg border-2 border-emerald-400/80 bg-emerald-950/50 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                    CLEARANCE CIPHER DECRYPTED:
                  </span>
                  <div className="text-2xl font-black font-mono tracking-widest text-emerald-200">
                    {awardedCode}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {awardedCode ? (
                <CyberButton
                  onClick={handleUseCode}
                  variant="green"
                  size="md"
                  className="flex-1"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  AUTOFILL & ENTER CIPHER
                </CyberButton>
              ) : (
                <CyberButton
                  onClick={startGame}
                  variant="amber"
                  size="md"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  RETRY OVERRIDE
                </CyberButton>
              )}
              <CyberButton onClick={onClose} variant="ghost" size="md">
                CLOSE
              </CyberButton>
            </div>
          </div>
        )}
      </CyberCard>
    </div>
  );
}

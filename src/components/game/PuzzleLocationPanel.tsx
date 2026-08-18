"use client";

import React, { useState } from "react";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { Puzzle, CheckCircle2, Lock, X, MapPin } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface PuzzleLocationPanelProps {
  hunt: Hunt;
  progress: TeamProgress | null;
  onClose: () => void;
  onCollectPiece: (pieceId: string) => Promise<boolean>;
}

export function PuzzleLocationPanel({
  hunt,
  progress,
  onClose,
  onCollectPiece,
}: PuzzleLocationPanelProps) {
  const [loadingPieceId, setLoadingPieceId] = useState<string | null>(null);

  const completedNodes = new Set(progress?.completedNodes || []);
  const collectedPieces = new Set(progress?.collectedPieces || []);
  const teamRoute = progress?.routeId ? hunt.routes[progress.routeId] : null;
  const routeNodes = teamRoute?.nodes || [];

  // Exactly 6 physical fragments from Stages 2 to 7
  const piecesList = [1, 2, 3, 4, 5, 6].map((pieceNum) => {
    const stageIndex = pieceNum; // Stage 2 is index 1, Stage 7 is index 6
    const nodeId = routeNodes[stageIndex];
    const node = nodeId ? hunt.nodes[nodeId] : null;
    const pieceId = `PIECE_${pieceNum}`;
    const isUnlocked = nodeId ? completedNodes.has(nodeId) : false;
    const isCollected = collectedPieces.has(pieceId);
    const puzzleInfo = node?.routePuzzleLocations?.[progress?.routeId || "P1"] || node?.puzzleLocation;

    return {
      pieceNumber: pieceNum,
      pieceId,
      nodeId: nodeId || "???",
      stageNumber: pieceNum + 1,
      roomName: isUnlocked ? (node?.name || nodeId) : `Stage #${pieceNum + 1} (Classified)`,
      clue: isUnlocked
        ? (puzzleInfo?.clue || `Physical Fragment #${pieceNum} is cached in this room. Search the area!`)
        : `Locked. Decrypt Stage #${pieceNum + 1} to reveal this fragment's physical coordinates.`,
      hint: isUnlocked ? puzzleInfo?.hint : undefined,
      isUnlocked,
      isCollected,
    };
  });

  const handleMarkCollected = async (pieceId: string) => {
    soundFx.playClick();
    setLoadingPieceId(pieceId);
    try {
      await onCollectPiece(pieceId);
    } finally {
      setLoadingPieceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <CyberCard className="w-full max-w-xl p-6 space-y-5 border-cyan-500/80 shadow-[0_0_35px_rgba(0,240,255,0.25)] max-h-[90vh] overflow-y-auto font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Puzzle className="w-6 h-6" />
            <div>
              <h2 className="font-black text-lg text-slate-100 uppercase tracking-wider">
                PHYSICAL CACHE REGISTRY (6 TOTAL FRAGMENTS)
              </h2>
              <p className="text-xs text-slate-400">
                Retrieved: {collectedPieces.size} / 6 Fragments (Stages 2–7). After Stage 7, focus turns to pure riddles & Boss challenge!
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

        {/* Piece Items */}
        <div className="space-y-3">
          {piecesList.map((item) => {
            return (
              <div
                key={item.pieceId}
                className={`p-4 rounded-lg border transition-all ${
                  item.isCollected
                    ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                    : item.isUnlocked
                    ? "border-cyan-500/40 bg-cyan-950/20 text-cyan-200"
                    : "border-slate-800 bg-[#050811] text-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        item.isCollected
                          ? "border-emerald-500/60 bg-emerald-900/60 text-emerald-300"
                          : item.isUnlocked
                          ? "border-cyan-500/60 bg-cyan-900/60 text-cyan-300"
                          : "border-slate-800 bg-slate-900 text-slate-600"
                      }`}
                    >
                      FRAGMENT #{item.pieceNumber} (STAGE #{item.stageNumber})
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {item.roomName}
                    </span>
                  </div>

                  {item.isCollected ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      IN SQUAD BAG
                    </span>
                  ) : item.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs text-cyan-300 font-bold animate-pulse">
                      <MapPin className="w-4 h-4" />
                      AVAILABLE TO RETRIEVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Lock className="w-3.5 h-3.5" />
                      LOCKED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  {item.clue}
                </p>

                {item.hint && (
                  <p className="text-[11px] text-amber-300/80 italic mb-3">
                    💡 Hint: {item.hint}
                  </p>
                )}

                {item.isUnlocked && !item.isCollected && (
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <CyberButton
                      onClick={() => handleMarkCollected(item.pieceId)}
                      loading={loadingPieceId === item.pieceId}
                      variant="green"
                      size="sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      CONFIRM PHYSICAL PIECE RETRIEVED
                    </CyberButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-[#050811] text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">
            ℹ️ Grand Treasure Assemble Rule:
          </p>
          <p>
            Stages 8, 9 (Boss), 10, 11, and 12 do not contain physical pieces. Bring all 6 fragments collected in Stages 2–7 to the Final Vault in the Auditorium to assemble the master relic!
          </p>
        </div>
      </CyberCard>
    </div>
  );
}

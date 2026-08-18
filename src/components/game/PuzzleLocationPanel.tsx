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

  // Collect all unique pieces from hunt nodes
  const pieceMap: Record<string, { pieceId: string; nodeId: string; roomName: string; clue: string; hint?: string; isUnlocked: boolean; isCollected: boolean }> = {};

  Object.values(hunt.nodes).forEach((node) => {
    if (node.puzzleLocation?.pieceId) {
      const pieceId = node.puzzleLocation.pieceId;
      const isUnlocked = completedNodes.has(node.id);
      const isCollected = collectedPieces.has(pieceId);

      if (!pieceMap[pieceId] || isUnlocked) {
        pieceMap[pieceId] = {
          pieceId,
          nodeId: node.id,
          roomName: node.name,
          clue: node.puzzleLocation.clue,
          hint: node.puzzleLocation.hint,
          isUnlocked,
          isCollected,
        };
      }
    }
  });

  const piecesList = Object.values(pieceMap);

  const handleMarkCollected = async (pieceId: string) => {
    setLoadingPieceId(pieceId);
    try {
      await onCollectPiece(pieceId);
    } finally {
      setLoadingPieceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <CyberCard className="w-full max-w-xl p-6 space-y-5 border-cyan-500/80 shadow-[0_0_35px_rgba(0,240,255,0.25)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Puzzle className="w-6 h-6" />
            <div>
              <h2 className="font-mono font-black text-lg text-slate-100 uppercase tracking-wider">
                PHYSICAL CACHE REGISTRY
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Squad Physical Artifacts: {collectedPieces.size} / {piecesList.length} Retrieved
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
        <div className="space-y-3 font-mono">
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
                    {item.isCollected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : item.isUnlocked ? (
                      <MapPin className="w-5 h-5 text-cyan-400 animate-bounce" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                    <span className="font-black text-sm tracking-wider">
                      {item.pieceId.replace("_", " ")}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.isCollected
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/50"
                        : item.isUnlocked
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50"
                        : "bg-slate-900 text-slate-600 border border-slate-800"
                    }`}
                  >
                    {item.isCollected ? "SECURED IN PHYSICAL SQUAD CACHE" : item.isUnlocked ? "CLUE REVEALED" : "SECTOR LOCKED"}
                  </span>
                </div>

                {item.isUnlocked ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-200 italic font-sans">{item.clue}</p>
                    {item.hint && (
                      <p className="text-[11px] text-cyan-400 font-mono">
                        Tactical Hint: {item.hint}
                      </p>
                    )}
                    <div className="pt-2 flex justify-end">
                      {!item.isCollected ? (
                        <CyberButton
                          onClick={() => handleMarkCollected(item.pieceId)}
                          loading={loadingPieceId === item.pieceId}
                          variant="green"
                          size="sm"
                        >
                          MARK PHYSICALLY RETRIEVED
                        </CyberButton>
                      ) : (
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PHYSICALLY COLLECTED
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">
                    Clear Sector {item.nodeId} to decrypt this physical piece location.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <CyberButton onClick={onClose} variant="ghost" size="md">
            CLOSE REGISTRY
          </CyberButton>
        </div>
      </CyberCard>
    </div>
  );
}

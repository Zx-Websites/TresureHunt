"use client";

import React from "react";
import { ClientHuntNode, HuntRoute, Hunt } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Trophy,
  Compass,
} from "lucide-react";

interface CyberMapProps {
  clientNodes: ClientHuntNode[];
  activeRoute: HuntRoute | null;
  onSelectNode: (node: ClientHuntNode) => void;
  hunt?: Hunt;
}

export function CyberMap({
  clientNodes,
  activeRoute,
  onSelectNode,
}: CyberMapProps) {
  // If no route is defined, fallback to available client nodes
  const routeNodeIds = activeRoute?.nodes || clientNodes.map((n) => n.id);

  // Set of completed node IDs
  const completedNodeIds = new Set(
    clientNodes.filter((n) => n.state === "COMPLETED").map((n) => n.id)
  );

  // Find the exact single active stage index in the route (the FIRST node that is not completed)
  const activeStageIndex = routeNodeIds.findIndex((id) => !completedNodeIds.has(id));

  // Map each route step to its strict sequential state
  const stages = routeNodeIds.map((nodeId, idx) => {
    const rawNode = clientNodes.find((n) => n.id === nodeId) || {
      id: nodeId,
      name: "Classified Objective",
      floorId: "floor-1",
      type: nodeId === "401A" ? "BOSS" : idx === routeNodeIds.length - 1 ? "FINAL" : "NORMAL",
      position: { x: 50, y: 50 },
      state: "LOCKED",
      nextNodes: [],
    };

    const isCompleted = completedNodeIds.has(nodeId);
    // ONLY ONE SINGLE STAGE can EVER be active (the first uncompleted stage index)
    const isAvailable = !isCompleted && idx === activeStageIndex;
    const isLocked = !isCompleted && !isAvailable;

    const node: ClientHuntNode = {
      ...rawNode,
      state: isCompleted ? "COMPLETED" : isAvailable ? "AVAILABLE" : "LOCKED",
    };

    return {
      stageNumber: idx + 1,
      nodeId,
      node,
      isFirst: idx === 0,
      isLast: idx === routeNodeIds.length - 1,
      isBoss: nodeId === "401A" || node.type === "BOSS",
      isFinal: idx === routeNodeIds.length - 1 || node.type === "FINAL",
      isCompleted,
      isAvailable,
      isLocked,
    };
  });

  const completedCount = stages.filter((s) => s.isCompleted).length;

  const handleNodeClick = (stage: typeof stages[0]) => {
    if (stage.isLocked) {
      soundFx.playAccessDenied();
      return;
    }
    soundFx.playNodeSelect();
    onSelectNode(stage.node);
  };

  return (
    <CyberCard className="p-4 sm:p-6 space-y-6 border-cyan-500/40 font-mono relative overflow-hidden">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin" />
          <div>
            <h2 className="text-base font-black text-slate-100 uppercase tracking-wider">
              SEQUENTIAL ROUTE MATRIX ({activeRoute?.name || "ACTIVE MISSION"})
            </h2>
            <p className="text-xs text-slate-400">
              Strict sequential progression: exactly ONE active riddle at a time in chronological order.
            </p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">SQUAD PROGRESS</span>
            <span className="text-xs font-black text-cyan-300">
              {completedCount} / {stages.length} STAGES CLEARED
            </span>
          </div>
          <div className="h-9 w-24 bg-slate-900 rounded-full border border-slate-800 p-1 flex items-center">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_10px_#00f0ff] transition-all duration-500"
              style={{
                width: `${Math.max(5, (completedCount / Math.max(1, stages.length)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Non-Draggable Connected Sequential Stage Flowchart */}
      <div className="py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative">
          {stages.map((stage, idx) => {
            const isCompleted = stage.isCompleted;
            const isAvailable = stage.isAvailable;
            const isLocked = stage.isLocked;
            const isBoss = stage.isBoss;
            const isFinal = stage.isFinal;

            return (
              <div key={`${stage.nodeId}-${idx}`} className="relative flex flex-col">
                {/* Node Box */}
                <button
                  type="button"
                  onClick={() => handleNodeClick(stage)}
                  disabled={isLocked}
                  className={`w-full text-left rounded-xl p-4 sm:p-5 border-2 transition-all duration-300 relative flex flex-col justify-between min-h-[145px] ${
                    isCompleted
                      ? "border-emerald-400/80 bg-emerald-950/40 text-emerald-100 shadow-[0_0_20px_rgba(0,255,157,0.25)] hover:border-emerald-300 cursor-pointer"
                      : isAvailable
                      ? isBoss
                        ? "border-amber-400 bg-amber-950/70 text-amber-100 shadow-[0_0_30px_rgba(255,184,0,0.5)] animate-pulse cursor-pointer scale-[1.02]"
                        : isFinal
                        ? "border-yellow-400 bg-yellow-950/70 text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-pulse cursor-pointer scale-[1.02]"
                        : "border-cyan-400 bg-cyan-950/70 text-cyan-100 shadow-[0_0_25px_rgba(0,240,255,0.45)] animate-pulse cursor-pointer scale-[1.02]"
                      : "border-slate-800 bg-[#070B19]/90 text-slate-500 cursor-not-allowed opacity-75"
                  }`}
                >
                  {/* Top Row: Stage Index & State Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded border ${
                        isCompleted
                          ? "border-emerald-500/60 bg-emerald-900/60 text-emerald-300"
                          : isAvailable
                          ? isBoss
                            ? "border-amber-400 bg-amber-900/80 text-amber-200"
                            : isFinal
                            ? "border-yellow-400 bg-yellow-900/80 text-yellow-200"
                            : "border-cyan-400 bg-cyan-900/80 text-cyan-200"
                          : "border-slate-700/60 bg-slate-900/60 text-slate-500"
                      }`}
                    >
                      STAGE #{stage.stageNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>CLEARED</span>
                        </span>
                      ) : isAvailable ? (
                        isBoss ? (
                          <span className="flex items-center gap-1 text-amber-400 text-xs font-bold animate-bounce">
                            <AlertTriangle className="w-4 h-4" />
                            <span>BOSS TARGET</span>
                          </span>
                        ) : isFinal ? (
                          <span className="flex items-center gap-1 text-yellow-300 text-xs font-bold animate-bounce">
                            <Trophy className="w-4 h-4" />
                            <span>FINAL VAULT</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-cyan-300 text-xs font-bold">
                            <Unlock className="w-4 h-4" />
                            <span>ACTIVE RIDDLE</span>
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>LOCKED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Stage Content Title */}
                  <div className="my-auto py-1">
                    <h3
                      className={`text-sm sm:text-base font-black truncate leading-snug ${
                        isCompleted
                          ? "text-emerald-200"
                          : isAvailable
                          ? isBoss
                            ? "SECTOR 401A [BOSS CHALLENGE]"
                            : isFinal
                            ? "THE GRAND FINAL VAULT"
                            : "ACTIVE RIDDLE OBJECTIVE"
                          : `STAGE #${stage.stageNumber} [CLASSIFIED]`
                      }`}
                    >
                      {isCompleted
                        ? `${stage.node.name}`
                        : isAvailable
                        ? isBoss
                          ? "SECTOR 401A [BOSS CHALLENGE]"
                          : isFinal
                          ? "THE GRAND FINAL VAULT"
                          : "ACTIVE RIDDLE OBJECTIVE"
                        : `STAGE #${stage.stageNumber} [CLASSIFIED]`}
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {isCompleted
                        ? "Sector cleared. Physical piece recovered."
                        : isAvailable
                        ? "Tap to read transmission riddle & submit cipher."
                        : "Locked. Clear previous stage in sequence to decrypt."}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-bold ${
                      isCompleted
                        ? "border-emerald-500/30 text-emerald-400"
                        : isAvailable
                        ? isBoss
                          ? "border-amber-400/50 text-amber-300"
                          : "border-cyan-400/50 text-cyan-300"
                        : "border-slate-800/80 text-slate-600"
                    }`}
                  >
                    <span>
                      {isCompleted
                        ? "REVIEW SECTOR"
                        : isAvailable
                        ? "DECODE & ENTER CODE"
                        : "SOLVE PREVIOUS STAGE"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </CyberCard>
  );
}

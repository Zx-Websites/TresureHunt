"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useHuntGame } from "@/lib/game-engine/useHuntGame";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { TeamSelector } from "@/components/auth/TeamSelector";
import { CyberHeader } from "@/components/game/CyberHeader";
import { CyberMap } from "@/components/game/CyberMap";
import { NodeDetailsModal } from "@/components/game/NodeDetailsModal";
import { PuzzleLocationPanel } from "@/components/game/PuzzleLocationPanel";
import { FinalTreasureModal } from "@/components/game/FinalTreasureModal";
import { LostDashboard } from "@/components/game/LostDashboard";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberButton } from "@/components/ui/CyberButton";
import { ClientHuntNode } from "@/lib/game-engine/types";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  Shield,
  Compass,
  Radio,
  KeyRound,
  Puzzle,
  Trophy,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const { profile, idToken, loading: authLoading } = useAuth();
  const [showPuzzlePanel, setShowPuzzlePanel] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Hook for game state
  const {
    hunt,
    progress,
    clientNodes,
    selectedNode,
    setSelectedNode,
    isSubmittingCode,
    submitCode,
    submitMinigameScore,
    collectPhysicalPiece,
  } = useHuntGame(profile?.huntId || "icat-2026", profile?.teamId, idToken);

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#04070F] text-cyan-400 font-mono space-y-4">
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-[0_0_25px_rgba(0,240,255,0.4)]" />
        <p className="text-xs tracking-widest uppercase animate-pulse">
          INITIALIZING CYBER PROTOCOL MATRIX...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State (Google Sign In Gate)
  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#04070F] text-slate-100 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-8 text-center relative z-10 animate-in fade-in">
          {/* Logo & Emblem */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl border-2 border-cyan-400 bg-cyan-950/40 text-cyan-300 font-mono text-3xl font-black shadow-[0_0_35px_rgba(0,240,255,0.4)] mx-auto animate-pulse">
            ◈
          </div>

          <div className="space-y-2 font-mono">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 text-xs tracking-widest uppercase">
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span>LIVE CAMPUS EVENT 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-slate-100 uppercase">
              TREASURE HUNT PLATFORM
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Physical Campus Navigation & Cryptographic Mainframe Decryption Interface
            </p>
          </div>

          {/* Google Sign In Component */}
          <GoogleSignInButton />

          <div className="pt-4 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
            <p>Physical campus coordinates linked to digital nodes.</p>
            <p className="text-cyan-400">ICAT Bangalore 2026 — Official System</p>
          </div>
        </div>
      </main>
    );
  }

  // 3. Team Selection Gate (If user logged in but has not chosen team)
  if (!profile.teamId) {
    return (
      <main className="min-h-screen bg-[#04070F] text-slate-100 flex items-center justify-center p-4">
        <TeamSelector />
      </main>
    );
  }

  // 4. Lost / Disqualified Elimination Lockout Screen
  if (progress && (progress.status === "lost" || progress.status === "disqualified")) {
    return <LostDashboard progress={progress} hunt={hunt} />;
  }

  // 4. Main Game Screen for Students
  const activeRoute = progress?.routeId ? hunt.routes[progress.routeId] : null;

  // Active or Available Node for Quick Access (Strictly single active riddle)
  const nextAvailableNode = clientNodes.find((n) => n.state === "AVAILABLE");

  const handleQuickNodeClick = (node: ClientHuntNode) => {
    soundFx.playNodeSelect();
    setSelectedNode(node);
  };

  return (
    <div className="min-h-screen bg-[#04070F] text-slate-100 flex flex-col font-mono pb-12">
      {/* Top Cyber HUD Header */}
      <CyberHeader
        hunt={hunt}
        progress={progress}
        onOpenPuzzleDrawer={() => setShowPuzzlePanel(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Non-Draggable Connected Sequential Stage Flowchart Map */}
        <CyberMap
          hunt={hunt}
          clientNodes={clientNodes}
          activeRoute={activeRoute}
          onSelectNode={(node) => setSelectedNode(node)}
        />

        {/* Current Active Mission / Quick Action Clue Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Target Banner */}
          <CyberCard className="md:col-span-2 p-4 space-y-2 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                <Compass className="w-4 h-4 animate-spin" />
                <span>CURRENT ACTIVE TARGET (STAGE {progress?.completedNodes?.length ? progress.completedNodes.length + 1 : 1})</span>
              </span>
              {nextAvailableNode && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  {nextAvailableNode.type === "BOSS" ? "BOSS 401A" : "ENCRYPTED RIDDLE"}
                </span>
              )}
            </div>

            {nextAvailableNode ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100">
                    {nextAvailableNode.riddle?.title || "Encrypted Mission Clue"}
                  </h3>
                  <p className="text-xs text-slate-400 italic line-clamp-1">
                    &quot;{nextAvailableNode.riddle?.text}&quot;
                  </p>
                </div>
                <CyberButton
                  onClick={() => handleQuickNodeClick(nextAvailableNode)}
                  variant={nextAvailableNode.type === "BOSS" ? "amber" : "cyan"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  OPEN RIDDLE & ENTER CIPHER
                </CyberButton>
              </div>
            ) : progress?.status === "completed" ? (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h3 className="font-bold text-emerald-300">
                    ALL SECTORS DECRYPTED
                  </h3>
                  <p className="text-xs text-slate-400">
                    Grand Master Vault unlocked for your squad!
                  </p>
                </div>
                <CyberButton
                  onClick={() => setShowVictoryModal(true)}
                  variant="amber"
                  size="sm"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1.5" />
                  VIEW MASTER VAULT
                </CyberButton>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pt-1">
                All nodes on this path cleared. Check other decks or review your physical cache!
              </p>
            )}
          </CyberCard>

          {/* Quick Physical Cache Summary */}
          <CyberCard className="p-4 space-y-2 border-emerald-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <Puzzle className="w-4 h-4" />
                <span>PHYSICAL ARTIFACTS</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {progress?.collectedPieces?.length || 0} COLLECTED
              </span>
            </div>

            <p className="text-xs text-slate-300">
              Recover physical puzzle pieces from decrypted rooms to assemble the final key.
            </p>

            <CyberButton
              onClick={() => setShowPuzzlePanel(true)}
              variant="green"
              size="sm"
              className="w-full"
            >
              OPEN ARTIFACT REGISTRY
            </CyberButton>
          </CyberCard>
        </div>
      </main>

      {/* Node Details Modal (Riddle -> Enter Code -> Confirm Got Puzzle -> Next) */}
      {selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          progress={progress}
          onClose={() => setSelectedNode(null)}
          isSubmittingCode={isSubmittingCode}
          onSubmitCode={submitCode}
          onSubmitMinigame={submitMinigameScore}
          onCollectPiece={collectPhysicalPiece}
        />
      )}

      {/* Puzzle Location Panel Drawer */}
      {showPuzzlePanel && (
        <PuzzleLocationPanel
          hunt={hunt}
          progress={progress}
          onClose={() => setShowPuzzlePanel(false)}
          onCollectPiece={collectPhysicalPiece}
        />
      )}

      {/* Grand Final Treasure Vault Modal */}
      {(showVictoryModal || progress?.status === "completed") && (
        <FinalTreasureModal
          hunt={hunt}
          progress={
            progress || {
              huntId: hunt.id,
              teamId: profile.teamId,
              routeId: "P1",
              currentNodeId: "FINAL_VAULT",
              unlockedNodes: [],
              completedNodes: Object.keys(hunt.nodes),
              collectedPieces: [],
              bossProgress: {},
              status: "completed",
              startedAt: Date.now(),
              updatedAt: Date.now(),
            }
          }
          onClose={() => setShowVictoryModal(false)}
        />
      )}
    </div>
  );
}

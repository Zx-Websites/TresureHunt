"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Hunt, TeamProgress, TeamConfig } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA, ICAT_2026_HUNT_ID } from "@/lib/game-engine/icat-2026-seed-data";
import { CyberCard } from "@/components/ui/CyberCard";
import {
  Activity,
  Trophy,
  Skull,
  ShieldAlert,
  Puzzle,
  Compass,
  Radio,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
  Zap,
  ExternalLink,
  Shield,
  Eye,
} from "lucide-react";

export default function TrackPage() {
  const [hunt, setHunt] = useState<Hunt>(ICAT_2026_HUNT_DATA);
  const [progressMap, setProgressMap] = useState<Record<string, TeamProgress>>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Real-time clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Hunt config
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "hunts", ICAT_2026_HUNT_ID),
      (snap) => {
        if (snap.exists()) {
          setHunt(snap.data() as Hunt);
        }
      },
      (err) => console.warn("Track hunt listener fallback:", err)
    );
    return () => unsub();
  }, []);

  // Listen to Team Progress in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "teamProgress"),
      (snapshot) => {
        const mapping: Record<string, TeamProgress> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as TeamProgress;
          if (data.huntId === ICAT_2026_HUNT_ID) {
            mapping[data.teamId] = data;
          }
        });
        setProgressMap(mapping);
        setLoading(false);
      },
      (err) => {
        console.warn("Track telemetry fallback:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const teams = Object.values(hunt.teams);

  // Calculate Leaderboard rankings
  const rankedTeams = [...teams].sort((a, b) => {
    const progA = progressMap[a.id];
    const progB = progressMap[b.id];

    const isWinnerA = progA?.status === "completed";
    const isWinnerB = progB?.status === "completed";
    if (isWinnerA && !isWinnerB) return -1;
    if (!isWinnerA && isWinnerB) return 1;

    const isLostA = progA?.status === "lost" || progA?.status === "disqualified";
    const isLostB = progB?.status === "lost" || progB?.status === "disqualified";
    if (!isLostA && isLostB) return -1;
    if (isLostA && !isLostB) return 1;

    const completedA = progA?.completedNodes?.length || 0;
    const completedB = progB?.completedNodes?.length || 0;
    if (completedA !== completedB) return completedB - completedA;

    const piecesA = progA?.collectedPieces?.length || 0;
    const piecesB = progB?.collectedPieces?.length || 0;
    return piecesB - piecesA;
  });

  // Global telemetry stats
  const totalTeamsCount = teams.length;
  const activeTeamsCount = teams.filter((t) => {
    const s = progressMap[t.id]?.status;
    return !s || s === "active";
  }).length;
  const completedSquad = teams.find((t) => progressMap[t.id]?.status === "completed");
  const squadsWith6Pieces = teams.filter((t) => (progressMap[t.id]?.collectedPieces?.length || 0) >= 6);

  return (
    <main className="min-h-screen bg-[#030611] text-slate-100 font-mono flex flex-col p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Top Telemetry Command Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyan-500/30 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 text-xs font-bold uppercase tracking-widest animate-pulse">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-ping" />
              <span>LIVE TELEMETRY BROADCAST</span>
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              FIRESTORE REALTIME STREAM
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider text-slate-100 uppercase">
            {hunt.name || "ICAT BANGALORE TREASURE HUNT 2026"}
          </h1>
          <p className="text-xs text-slate-400">
            Realtime Campus Squad Tracking & Decryption Race Display
          </p>
        </div>

        {/* Global Key Metrics Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Clock */}
          <div className="p-3 rounded-xl border border-slate-800 bg-[#070B1A] flex items-center gap-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-500 block">SYSTEM TIME</span>
              <span className="text-sm font-black text-cyan-300 tracking-wider">
                {currentTime || "00:00:00"}
              </span>
            </div>
          </div>

          {/* Qualified Squads (18-piece rule) */}
          <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex items-center gap-3">
            <Puzzle className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block">
                6-PIECE RACE (18 TOTAL)
              </span>
              <span className="text-sm font-black text-emerald-200">
                {squadsWith6Pieces.length} / 3 SPOTS CLAIMED
              </span>
            </div>
          </div>

          {/* Active Status */}
          <div className="p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/30 flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-400 block">SQUADS REMAINING</span>
              <span className="text-sm font-black text-cyan-200">
                {activeTeamsCount} / {totalTeamsCount} ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-3 rounded-xl border border-slate-800 bg-[#070B1A] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>PLAYER HUD</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Winner Spotlight Banner (If Grand Vault Breached) */}
      {completedSquad && (
        <div className="rounded-2xl border-2 border-yellow-400/90 bg-gradient-to-r from-yellow-950/80 via-amber-950/80 to-yellow-950/80 p-6 sm:p-8 text-center space-y-3 shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-in zoom-in-95 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-yellow-400 bg-yellow-900/60 text-yellow-200 text-xs font-black tracking-widest uppercase animate-bounce">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>GRAND CHAMPION CROWNED</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-yellow-300 uppercase tracking-wider drop-shadow-[0_0_25px_rgba(250,204,21,0.8)]">
            {completedSquad.name} HAS WON THE TREASURE HUNT!
          </h2>

          <p className="text-sm text-yellow-100/90 max-w-xl mx-auto">
            Breached Sector 401A, recovered all physical fragments, and unlocked the Grand Master Vault in the Auditorium!
          </p>
        </div>
      )}

      {/* Full-Viewport Squad Race Lanes */}
      <section className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider">
              REALTIME SQUAD RACE LANES & STAGE TIMELINES
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Ordered by: Finish State ➔ Cleared Sectors ➔ Recovered Fragments
          </span>
        </div>

        <div className="space-y-4">
          {rankedTeams.map((team, rankIdx) => {
            const prog = progressMap[team.id];
            const routeId = prog?.routeId || team.routeId || "P1";
            const route = hunt.routes[routeId];
            const routeNodes = route?.nodes || [];

            const completedSet = new Set(prog?.completedNodes || []);
            const collectedPiecesSet = new Set(prog?.collectedPieces || []);
            const completedCount = completedSet.size;
            const piecesCount = collectedPiecesSet.size;

            const status = prog?.status || "active";
            const isWinner = status === "completed";
            const isDisqualified = status === "disqualified";
            const isLost = status === "lost";

            // Find current active node in route
            const activeNodeIndex = routeNodes.findIndex((id) => !completedSet.has(id));
            const currentNodeId = activeNodeIndex !== -1 ? routeNodes[activeNodeIndex] : routeNodes[routeNodes.length - 1];
            const currentNode = hunt.nodes[currentNodeId];

            const progressPercentage = Math.round((completedCount / Math.max(1, routeNodes.length)) * 100);

            return (
              <CyberCard
                key={team.id}
                className={`p-5 sm:p-6 transition-all border-2 relative overflow-hidden ${
                  isWinner
                    ? "border-yellow-400 bg-yellow-950/30 shadow-[0_0_30px_rgba(250,204,21,0.3)]"
                    : isDisqualified
                    ? "border-rose-600/60 bg-rose-950/20 opacity-75"
                    : isLost
                    ? "border-red-800/60 bg-red-950/20 opacity-70"
                    : "border-cyan-500/40 bg-[#060A18]/90 hover:border-cyan-400"
                }`}
              >
                {/* Team Info Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  {/* Left: Squad Badge & Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg border shadow-lg"
                      style={{
                        backgroundColor: `${team.hex}25`,
                        borderColor: team.hex,
                        color: team.hex,
                      }}
                    >
                      #{rankIdx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full inline-block animate-pulse"
                          style={{ backgroundColor: team.hex }}
                        />
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide">
                          {team.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-bold">({team.id})</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-cyan-300 font-bold">{route?.name || `Route ${routeId}`}</span>
                        <span>•</span>
                        <span>
                          Current Target:{" "}
                          <span className="text-amber-300 font-bold">
                            {isWinner
                              ? "GRAND VAULT CLEARED"
                              : isLost
                              ? "ELIMINATED"
                              : currentNode?.name || currentNodeId || "Genesis Station"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Telemetry Badges & Status */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Fragments Badge */}
                    <div className="p-2 px-3 rounded-lg border border-slate-800 bg-black/40 flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-emerald-400" />
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[10px]">FRAGMENTS</span>
                        <span
                          className={`font-black ${
                            piecesCount >= 6 ? "text-emerald-300" : "text-slate-300"
                          }`}
                        >
                          {piecesCount} / 6 PIECES
                        </span>
                      </div>
                    </div>

                    {/* Sectors Cleared */}
                    <div className="p-2 px-3 rounded-lg border border-slate-800 bg-black/40 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <div className="text-xs">
                        <span className="text-slate-500 block text-[10px]">PROGRESS</span>
                        <span className="font-black text-cyan-300">
                          {completedCount} / {routeNodes.length} ({progressPercentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isWinner ? (
                        <span className="px-3 py-1.5 rounded-lg border border-yellow-400 bg-yellow-950/80 text-yellow-300 font-black text-xs flex items-center gap-1.5 animate-bounce">
                          <Trophy className="w-4 h-4" />
                          1ST PLACE WINNER
                        </span>
                      ) : isDisqualified ? (
                        <span className="px-3 py-1.5 rounded-lg border border-rose-500 bg-rose-950/80 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          DISQUALIFIED
                        </span>
                      ) : isLost ? (
                        <span className="px-3 py-1.5 rounded-lg border border-red-800 bg-red-950/80 text-red-400 font-bold text-xs flex items-center gap-1.5">
                          <Skull className="w-4 h-4" />
                          ELIMINATED
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ACTIVE IN HUNT
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual Sequential Node Timeline Bar */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>STAGE TIMELINE PROGRESSION</span>
                    <span>
                      {completedCount} of {routeNodes.length} Stages Completed
                    </span>
                  </div>

                  {/* Horizontal Node Track */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 sm:gap-2">
                    {routeNodes.map((nodeId, sIdx) => {
                      const isNodeCompleted = completedSet.has(nodeId);
                      const isNodeActive = !isNodeCompleted && sIdx === activeNodeIndex && !isLost && !isDisqualified;
                      const isNodeLocked = !isNodeCompleted && !isNodeActive;
                      const nodeData = hunt.nodes[nodeId];
                      const isBossNode = nodeId === "401A" || nodeData?.type === "BOSS";
                      const isFinalNode = sIdx === routeNodes.length - 1 || nodeData?.type === "FINAL";

                      return (
                        <div
                          key={`${nodeId}-${sIdx}`}
                          className={`rounded-lg p-2 text-center border transition-all flex flex-col justify-between min-h-[64px] ${
                            isNodeCompleted
                              ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-300"
                              : isNodeActive
                              ? isBossNode
                                ? "border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_15px_rgba(255,184,0,0.5)] animate-pulse scale-105"
                                : isFinalNode
                                ? "border-yellow-400 bg-yellow-950/80 text-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse scale-105"
                                : "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse scale-105"
                              : "border-slate-800/80 bg-slate-950/60 text-slate-600 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold">
                            <span>#{sIdx + 1}</span>
                            {isNodeCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : isNodeActive ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            ) : (
                              <Lock className="w-2.5 h-2.5 text-slate-600" />
                            )}
                          </div>

                          <div className="text-[10px] font-bold truncate my-0.5" title={nodeData?.name || nodeId}>
                            {isNodeCompleted
                              ? nodeData?.name || nodeId
                              : isNodeActive
                              ? isBossNode
                                ? "BOSS 401A"
                                : isFinalNode
                                ? "VAULT"
                                : nodeData?.name || nodeId
                              : `Stage ${sIdx + 1}`}
                          </div>

                          <div className="text-[8px] uppercase tracking-tighter">
                            {isNodeCompleted ? "DONE" : isNodeActive ? "IN ROOM" : "LOCKED"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CyberCard>
            );
          })}
        </div>
      </section>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        <p>ICAT Bangalore Treasure Hunt 2026 — Public Telemetry Command Wall (No authentication required)</p>
      </footer>
    </main>
  );
}

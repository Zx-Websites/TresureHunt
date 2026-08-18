"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA, ICAT_2026_HUNT_ID } from "@/lib/game-engine/icat-2026-seed-data";
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
  ExternalLink,
  Flame,
} from "lucide-react";

export default function TrackPage() {
  const [hunt, setHunt] = useState<Hunt>(ICAT_2026_HUNT_DATA);
  const [progressMap, setProgressMap] = useState<Record<string, TeamProgress>>({});
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
      },
      (err) => {
        console.warn("Track telemetry fallback:", err);
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
    <main className="h-screen max-h-screen w-screen overflow-hidden bg-[#030611] text-slate-100 font-mono flex flex-col p-2.5 sm:p-3 lg:p-4 gap-2 select-none">
      {/* Compact Top Telemetry Command Header */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-cyan-500/30 pb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <Radio className="w-3 h-3 text-cyan-400 animate-ping" />
              <span>LIVE BROADCAST</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-bold hidden sm:inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              REALTIME SYNC
            </span>
          </div>

          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-wider text-slate-100 uppercase truncate">
            {hunt.name || "ICAT BANGALORE TREASURE HUNT 2026"}
          </h1>
        </div>

        {/* Global Key Metrics Pills */}
        <div className="flex items-center gap-2 text-xs">
          {/* Clock */}
          <div className="px-2.5 py-1 rounded-lg border border-slate-800 bg-[#070B1A] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-black text-cyan-300 text-xs tracking-wider">
              {currentTime || "00:00:00"}
            </span>
          </div>

          {/* Qualified Squads (18-piece rule) */}
          <div className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-950/30 hidden md:flex items-center gap-1.5">
            <Puzzle className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="text-[11px] font-bold text-emerald-200">
              6-PIECE RACE: {squadsWith6Pieces.length}/3 CLAIMED
            </span>
          </div>

          {/* Active Status */}
          <div className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/30 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-200">
              {activeTeamsCount}/{totalTeamsCount} ACTIVE
            </span>
          </div>

          {/* Quick HUD Link */}
          <Link
            href="/"
            className="px-2.5 py-1 rounded-lg border border-slate-800 bg-[#070B1A] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">PLAYER HUD</span>
          </Link>
        </div>
      </header>

      {/* Winner Spotlight Banner (If Grand Vault Breached) */}
      {completedSquad && (
        <div className="flex-shrink-0 rounded-xl border border-yellow-400 bg-gradient-to-r from-yellow-950/90 via-amber-950/90 to-yellow-950/90 py-1.5 px-4 text-center flex items-center justify-between shadow-[0_0_25px_rgba(250,204,21,0.4)] animate-in zoom-in-95">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
              🏆 GRAND CHAMPION: {completedSquad.name} HAS BREACHED THE AUDITORIUM VAULT!
            </span>
          </div>
          <span className="text-[10px] text-yellow-200 font-bold hidden sm:inline">
            1ST PLACE VICTORY VERIFIED
          </span>
        </div>
      )}

      {/* 5 Squad Race Lanes: Distributed vertically across available screen height */}
      <section className="flex-1 min-h-0 flex flex-col justify-between gap-1.5">
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
            <div
              key={team.id}
              className={`flex-1 min-h-0 rounded-xl p-2 sm:p-2.5 transition-all border flex flex-col justify-between relative overflow-hidden ${
                isWinner
                  ? "border-yellow-400/90 bg-yellow-950/30 shadow-[0_0_20px_rgba(250,204,21,0.25)]"
                  : isDisqualified
                  ? "border-rose-600/50 bg-rose-950/20 opacity-70"
                  : isLost
                  ? "border-red-900/50 bg-red-950/20 opacity-65"
                  : "border-cyan-500/30 bg-[#060917]/95 hover:border-cyan-400/60"
              }`}
            >
              {/* Row 1: Squad Identity & Realtime Metrics */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1">
                {/* Left: Rank, Name, Route, Current Target */}
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-6 w-6 rounded-md flex items-center justify-center font-black text-xs border flex-shrink-0"
                    style={{
                      backgroundColor: `${team.hex}20`,
                      borderColor: team.hex,
                      color: team.hex,
                    }}
                  >
                    #{rankIdx + 1}
                  </span>

                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block flex-shrink-0 animate-pulse"
                      style={{ backgroundColor: team.hex }}
                    />
                    <span className="text-sm font-black text-slate-100 tracking-wide truncate">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">({team.id})</span>
                  </div>

                  <span className="text-[10px] text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 hidden sm:inline-block flex-shrink-0">
                    {routeId}
                  </span>

                  <span className="text-[11px] text-slate-400 truncate hidden md:inline-block">
                    Target:{" "}
                    <span className="text-amber-300 font-bold">
                      {isWinner
                        ? "GRAND VAULT CLEARED"
                        : isLost
                        ? "ELIMINATED"
                        : currentNode?.name || currentNodeId || "Genesis"}
                    </span>
                  </span>
                </div>

                {/* Right: Fragments, Progress %, Status */}
                <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                  {/* Pieces Meter */}
                  <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-800 flex items-center gap-1.5">
                    <Puzzle className="w-3 h-3 text-emerald-400" />
                    <span
                      className={`text-[11px] font-black ${
                        piecesCount >= 6 ? "text-emerald-300" : "text-slate-300"
                      }`}
                    >
                      {piecesCount}/6 PIECES
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-800 flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span className="text-[11px] font-black text-cyan-300">
                      {completedCount}/{routeNodes.length} ({progressPercentage}%)
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isWinner ? (
                      <span className="px-2 py-0.5 rounded bg-yellow-950 border border-yellow-400 text-yellow-300 font-black text-[10px] flex items-center gap-1 animate-bounce">
                        <Trophy className="w-3 h-3" />
                        WINNER
                      </span>
                    ) : isDisqualified ? (
                      <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-[10px] flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        DISQUALIFIED
                      </span>
                    ) : isLost ? (
                      <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-bold text-[10px] flex items-center gap-1">
                        <Skull className="w-3 h-3" />
                        LOST
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: 12-Stage Visual Progression Node Track */}
              <div className="grid grid-cols-12 gap-1 pt-1 items-center">
                {routeNodes.map((nodeId, sIdx) => {
                  const isNodeCompleted = completedSet.has(nodeId);
                  const isNodeActive = !isNodeCompleted && sIdx === activeNodeIndex && !isLost && !isDisqualified;
                  const nodeData = hunt.nodes[nodeId];
                  const isBossNode = nodeId === "401A" || nodeData?.type === "BOSS";
                  const isFinalNode = sIdx === routeNodes.length - 1 || nodeData?.type === "FINAL";

                  return (
                    <div
                      key={`${nodeId}-${sIdx}`}
                      className={`rounded p-1 text-center border transition-all flex flex-col justify-between h-[36px] sm:h-[40px] ${
                        isNodeCompleted
                          ? "border-emerald-500/80 bg-emerald-950/60 text-emerald-300"
                          : isNodeActive
                          ? isBossNode
                            ? "border-amber-400 bg-amber-950 text-amber-200 shadow-[0_0_12px_rgba(255,184,0,0.6)] animate-pulse scale-105"
                            : isFinalNode
                            ? "border-yellow-400 bg-yellow-950 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.6)] animate-pulse scale-105"
                            : "border-cyan-400 bg-cyan-950 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.5)] animate-pulse scale-105"
                          : "border-slate-800/70 bg-slate-950/50 text-slate-600 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[8px] font-bold leading-none">
                        <span>#{sIdx + 1}</span>
                        {isNodeCompleted ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        ) : isNodeActive ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        ) : (
                          <Lock className="w-2 h-2 text-slate-600" />
                        )}
                      </div>

                      <div
                        className="text-[9px] font-bold truncate leading-tight my-auto"
                        title={nodeData?.name || nodeId}
                      >
                        {isNodeCompleted
                          ? nodeData?.name || nodeId
                          : isNodeActive
                          ? isBossNode
                            ? "401A"
                            : isFinalNode
                            ? "VAULT"
                            : nodeData?.name || nodeId
                          : `${sIdx + 1}`}
                      </div>

                      <div className="text-[7px] uppercase tracking-tighter leading-none text-slate-400">
                        {isNodeCompleted ? "DONE" : isNodeActive ? "IN ROOM" : "LOCKED"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Ultra-compact Footer */}
      <footer className="flex-shrink-0 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1 px-1">
        <span>ICAT BANGALORE TREASURE HUNT 2026 — TELEMETRY COMMAND WALL</span>
        <span>REALTIME FIRESTORE SYNC ACTIVE (NO AUTH REQUIRED)</span>
      </footer>
    </main>
  );
}

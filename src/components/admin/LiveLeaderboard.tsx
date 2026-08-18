"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import {
  Activity,
  Trophy,
  RotateCcw,
  ShieldAlert,
  Skull,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
} from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface LiveLeaderboardProps {
  hunt: Hunt;
  idToken?: string | null;
}

export function LiveLeaderboard({ hunt, idToken }: LiveLeaderboardProps) {
  const [progressMap, setProgressMap] = useState<Record<string, TeamProgress>>({});
  const [loading, setLoading] = useState(true);
  const [activeActionTeam, setActiveActionTeam] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "teamProgress"),
      (snapshot) => {
        const mapping: Record<string, TeamProgress> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as TeamProgress;
          if (data.huntId === hunt.id) {
            mapping[data.teamId] = data;
          }
        });
        setProgressMap(mapping);
        setLoading(false);
      },
      (err) => {
        console.warn("Leaderboard snapshot fallback:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [hunt.id]);

  const teams = Object.values(hunt.teams);

  const handleTeamAction = async (teamId: string, action: "DISQUALIFY" | "REINSTATE" | "RESET_TEAM") => {
    const confirmMsg =
      action === "DISQUALIFY"
        ? `⚠️ Are you sure you want to DISQUALIFY squad ${teamId}? They will see "YOU LOST" immediately!`
        : action === "REINSTATE"
        ? `Re-activate squad ${teamId} and restore access to the hunt?`
        : `Reset all stages and puzzle pieces for squad ${teamId}?`;

    if (!confirm(confirmMsg)) return;

    soundFx.playClick();
    setActiveActionTeam(`${teamId}_${action}`);

    try {
      const res = await fetch("/api/admin/team-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: hunt.id,
          teamId,
          action,
        }),
      });

      if (res.ok) {
        soundFx.playAccessGranted();
      } else {
        soundFx.playAccessDenied();
      }
    } catch {
      soundFx.playAccessDenied();
    } finally {
      setActiveActionTeam(null);
    }
  };

  return (
    <CyberCard className="p-6 space-y-5 border-cyan-500/40 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity className="w-5 h-5 animate-pulse" />
          <h2 className="font-black text-base text-slate-100 uppercase tracking-wider">
            LIVE SQUAD TELEMETRY & CONTROLS MATRIX
          </h2>
        </div>
        <span className="text-xs text-emerald-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          REALTIME FIRESTORE SYNC (18 PIECES / 3-TEAM ELIMINATION ACTIVE)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 px-2">SQUAD</th>
              <th className="pb-3 px-2">ROUTE</th>
              <th className="pb-3 px-2">CURRENT NODE</th>
              <th className="pb-3 px-2">SECTORS</th>
              <th className="pb-3 px-2">FRAGMENTS</th>
              <th className="pb-3 px-2">STATUS</th>
              <th className="pb-3 px-2 text-right">ADMIN CONTROLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {teams.map((t) => {
              const prog = progressMap[t.id];
              const completedCount = prog?.completedNodes?.length || 0;
              const piecesCount = prog?.collectedPieces?.length || 0;
              const status = prog?.status || "active";
              const isDisqualified = status === "disqualified";
              const isLost = status === "lost";
              const isWinner = status === "completed";

              const totalRouteStages = hunt.routes[prog?.routeId || t.routeId]?.nodes?.length || 12;

              return (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.hex }} />
                      <span className="font-bold text-slate-200">{t.name}</span>
                      <span className="text-[10px] text-slate-400">({t.id})</span>
                    </div>
                  </td>

                  <td className="py-3 px-2 text-cyan-300 font-bold">
                    {prog?.routeId || t.routeId}
                  </td>

                  <td className="py-3 px-2 text-amber-300">
                    {prog?.currentNodeId || hunt.startingNodeId || "202"}
                  </td>

                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 font-bold">{completedCount}</span>
                      <span className="text-slate-500">/ {totalRouteStages}</span>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <span
                      className={`font-bold ${
                        piecesCount >= 6
                          ? "text-emerald-300"
                          : piecesCount > 0
                          ? "text-cyan-300"
                          : "text-slate-500"
                      }`}
                    >
                      {piecesCount} / 6 PIECES
                    </span>
                  </td>

                  <td className="py-3 px-2">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black bg-yellow-950/80 border border-yellow-400 text-yellow-300 animate-bounce">
                        <Trophy className="w-3.5 h-3.5" />
                        1ST PLACE WINNER
                      </span>
                    ) : isDisqualified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 border border-rose-500 text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        DISQUALIFIED
                      </span>
                    ) : isLost ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950/70 border border-red-800 text-red-400">
                        <Skull className="w-3.5 h-3.5" />
                        ELIMINATED / LOST
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ACTIVE IN HUNT
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Disqualify Button */}
                      {!isDisqualified && (
                        <CyberButton
                          onClick={() => handleTeamAction(t.id, "DISQUALIFY")}
                          loading={activeActionTeam === `${t.id}_DISQUALIFY`}
                          variant="red"
                          size="sm"
                          className="text-[10px] px-2 py-1"
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          DISQUALIFY
                        </CyberButton>
                      )}

                      {/* Reinstate Button */}
                      {(isDisqualified || isLost) && (
                        <CyberButton
                          onClick={() => handleTeamAction(t.id, "REINSTATE")}
                          loading={activeActionTeam === `${t.id}_REINSTATE`}
                          variant="green"
                          size="sm"
                          className="text-[10px] px-2 py-1"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          REINSTATE
                        </CyberButton>
                      )}

                      {/* Reset Team Button */}
                      <CyberButton
                        onClick={() => handleTeamAction(t.id, "RESET_TEAM")}
                        loading={activeActionTeam === `${t.id}_RESET_TEAM`}
                        variant="ghost"
                        size="sm"
                        className="text-[10px] px-2 py-1 text-slate-400 hover:text-slate-200"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        RESET
                      </CyberButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CyberCard>
  );
}

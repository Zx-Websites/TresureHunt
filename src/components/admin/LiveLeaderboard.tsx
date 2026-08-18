"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { Activity, Trophy, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface LiveLeaderboardProps {
  hunt: Hunt;
  idToken?: string | null;
}

export function LiveLeaderboard({ hunt, idToken }: LiveLeaderboardProps) {
  const [progressMap, setProgressMap] = useState<Record<string, TeamProgress>>({});
  const [loading, setLoading] = useState(true);
  const [resettingTeam, setResettingTeam] = useState<string | null>(null);

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

  const handleResetTeam = async (teamId: string) => {
    if (!confirm(`Are you sure you want to reset all progress for squad ${teamId}?`)) return;

    soundFx.playClick();
    setResettingTeam(teamId);

    try {
      await fetch("/api/admin/reset-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: hunt.id,
          teamId,
        }),
      });
      soundFx.playAccessGranted();
    } catch {
      soundFx.playAccessDenied();
    } finally {
      setResettingTeam(null);
    }
  };

  return (
    <CyberCard className="p-6 space-y-5 border-cyan-500/40">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity className="w-5 h-5 animate-pulse" />
          <h2 className="font-mono font-black text-base text-slate-100 uppercase tracking-wider">
            LIVE SQUAD TELEMETRY MATRIX
          </h2>
        </div>
        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          REALTIME FIRESTORE SYNC
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 px-2">SQUAD</th>
              <th className="pb-3 px-2">ROUTE</th>
              <th className="pb-3 px-2">CURRENT NODE</th>
              <th className="pb-3 px-2">SECTORS CLEARED</th>
              <th className="pb-3 px-2">PHYSICAL PIECES</th>
              <th className="pb-3 px-2">STATUS</th>
              <th className="pb-3 px-2 text-right">CONTROLS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {teams.map((t) => {
              const prog = progressMap[t.id];
              const completedCount = prog?.completedNodes?.length || 0;
              const piecesCount = prog?.collectedPieces?.length || 0;
              const isFinished = prog?.status === "completed";

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
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{completedCount}</span>
                      <span className="text-slate-400">/ {Object.keys(hunt.nodes).length}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-emerald-400 font-bold">
                    {piecesCount} Pieces
                  </td>
                  <td className="py-3 px-2">
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/60 border border-yellow-400 text-yellow-300">
                        <Trophy className="w-3 h-3" />
                        VAULT CLEARED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                        ACTIVE IN HUNT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <CyberButton
                      onClick={() => handleResetTeam(t.id)}
                      loading={resettingTeam === t.id}
                      variant="ghost"
                      size="sm"
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:border-rose-500/40"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      RESET SQUAD
                    </CyberButton>
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

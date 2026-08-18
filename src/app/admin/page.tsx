"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { useHuntGame } from "@/lib/game-engine/useHuntGame";
import { LiveLeaderboard } from "@/components/admin/LiveLeaderboard";
import { QuickSeeder } from "@/components/admin/QuickSeeder";
import { PathBuilder } from "@/components/admin/PathBuilder";
import { RiddleAndCodeEditor } from "@/components/admin/RiddleAndCodeEditor";
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberButton } from "@/components/ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import { ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import {
  ShieldAlert,
  ArrowLeft,
  Settings,
  Route,
  KeyRound,
  CheckCircle2,
  Activity,
} from "lucide-react";

export default function AdminPage() {
  const { profile, idToken } = useAuth();
  const { hunt } = useHuntGame("icat-2026", profile?.teamId, idToken);

  const [selectedTeam, setSelectedTeam] = useState<string>("RED");
  const [newRouteId, setNewRouteId] = useState<string>("P1");
  const [routeMsg, setRouteMsg] = useState<string | null>(null);
  const [isUpdatingRoute, setIsUpdatingRoute] = useState(false);

  const handleReassignRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Reassign squad ${selectedTeam} to route ${newRouteId}? This will re-target their progression path.`)) return;

    soundFx.playClick();
    setIsUpdatingRoute(true);
    setRouteMsg(null);

    try {
      const res = await fetch("/api/admin/reset-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: hunt.id,
          teamId: selectedTeam,
          newRouteId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setRouteMsg(`Squad ${selectedTeam} reassigned to Route ${newRouteId}.`);
      } else {
        soundFx.playAccessDenied();
        setRouteMsg("Failed to reassign route.");
      }
    } catch {
      soundFx.playAccessDenied();
      setRouteMsg("Network connection failure.");
    } finally {
      setIsUpdatingRoute(false);
    }
  };

  return (
    <AdminPasswordGate>
      <div className="min-h-screen bg-[#04070F] text-slate-100 p-4 sm:p-8 space-y-8 font-mono">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-800 bg-[#070B19] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO HUNT HUD</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-black tracking-wider uppercase">
              ORGANIZER MISSION CONTROL
            </h1>
          </div>
        </div>

          <Link
            href="/track"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
          >
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>OPEN /TRACK DISPLAY WALL</span>
          </Link>

          <span className="text-xs text-amber-400 font-bold px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30">
            EVENT: {hunt.name}
          </span>
        </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Real-time Telemetry Leaderboard */}
        <LiveLeaderboard hunt={hunt} idToken={idToken} />

        {/* Interactive Dynamic Path Flow Builder */}
        <PathBuilder hunt={hunt} idToken={idToken} />

        {/* Dedicated Room Riddle & Unlock Code Editor */}
        <RiddleAndCodeEditor hunt={hunt} idToken={idToken} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Seeder */}
          <QuickSeeder idToken={idToken} />

          {/* Route Reassignment Suite */}
          <CyberCard className="p-6 space-y-4 border-cyan-500/40">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-800 pb-3">
              <Route className="w-5 h-5" />
              <div>
                <h3 className="font-black text-base text-slate-100 uppercase tracking-wider">
                  DYNAMIC ROUTE REASSIGNMENT
                </h3>
                <p className="text-xs text-slate-400">Reconfigure team path assignments without code changes</p>
              </div>
            </div>

            <form onSubmit={handleReassignRoute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Squad</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  {Object.values(hunt.teams).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id}) - Current: Route {t.routeId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assign Target Route</label>
                <select
                  value={newRouteId}
                  onChange={(e) => setNewRouteId(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  {Object.values(hunt.routes).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.nodes.join(" → ")})
                    </option>
                  ))}
                </select>
              </div>

              {routeMsg && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{routeMsg}</span>
                </div>
              )}

              <CyberButton
                type="submit"
                loading={isUpdatingRoute}
                variant="cyan"
                size="md"
                className="w-full"
              >
                APPLY ROUTE REASSIGNMENT
              </CyberButton>
            </form>
          </CyberCard>
        </div>

        {/* Master Faculty & Organizer Secret Reference Table */}
        <CyberCard className="p-6 space-y-4 border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
            <KeyRound className="w-5 h-5" />
            <h3 className="font-black text-base text-slate-100 uppercase tracking-wider">
              FACULTY & ORGANIZER CLEARANCE DIRECTORY (CONFIDENTIAL)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 px-2">SECTOR ID</th>
                  <th className="pb-2 px-2">ROOM NAME</th>
                  <th className="pb-2 px-2">FLOOR</th>
                  <th className="pb-2 px-2">CODE SOURCE</th>
                  <th className="pb-2 px-2">TEST CODE</th>
                  <th className="pb-2 px-2">PHYSICAL PIECE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.values(hunt.nodes).map((n) => (
                  <tr key={n.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 font-bold text-cyan-400">{n.id}</td>
                    <td className="py-2.5 px-2">{n.name}</td>
                    <td className="py-2.5 px-2 uppercase">{n.floorId}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 rounded border border-slate-700 text-[10px]">
                        {n.codeSource}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-bold text-amber-300">
                      {ICAT_2026_SECRETS.codes[n.id]?.code || "CYBER2026"}
                      {n.id === "401A" && " (Score >= 850)"}
                    </td>
                    <td className="py-2.5 px-2 text-emerald-400">
                      {n.puzzleLocation?.pieceId || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CyberCard>
      </div>
    </div>
  </AdminPasswordGate>
  );
}

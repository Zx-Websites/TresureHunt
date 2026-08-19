"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { useHuntGame } from "@/lib/game-engine/useHuntGame";
import { LiveLeaderboard } from "@/components/admin/LiveLeaderboard";
import { QuickSeeder } from "@/components/admin/QuickSeeder";
import { RoutePathStudio } from "@/components/admin/RoutePathStudio";
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberButton } from "@/components/ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { HuntNode, HuntRoute } from "@/lib/game-engine/types";
import {
  ShieldAlert,
  ArrowLeft,
  Route,
  KeyRound,
  CheckCircle2,
  Activity,
  RefreshCw,
  Search,
  Puzzle,
  FileText,
} from "lucide-react";

export default function AdminPage() {
  const { profile, idToken } = useAuth();
  const { hunt } = useHuntGame("icat-2026", profile?.teamId, idToken);

  const [selectedTeam, setSelectedTeam] = useState<string>("RED");
  const [newRouteId, setNewRouteId] = useState<string>("P1");
  const [routeMsg, setRouteMsg] = useState<string | null>(null);
  const [isUpdatingRoute, setIsUpdatingRoute] = useState(false);
  const [isFetchingSecrets, setIsFetchingSecrets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Master local state synchronized with RoutePathStudio & Server
  const [localNodes, setLocalNodes] = useState<Record<string, HuntNode>>(() => ICAT_2026_HUNT_DATA.nodes);
  const [localRoutes, setLocalRoutes] = useState<Record<string, HuntRoute>>(() => ICAT_2026_HUNT_DATA.routes);
  const [liveSecrets, setLiveSecrets] = useState<Record<string, { code: string }>>(() => ICAT_2026_SECRETS.codes);
  const [secretsMap, setSecretsMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    Object.entries(ICAT_2026_SECRETS.codes).forEach(([k, v]) => {
      map[k] = v.code;
    });
    return map;
  });

  // Effective combined nodes & routes
  const effectiveNodes = useMemo<Record<string, HuntNode>>(() => ({
    ...ICAT_2026_HUNT_DATA.nodes,
    ...(hunt.nodes || {}),
    ...localNodes,
  }), [hunt.nodes, localNodes]);

  const effectiveRoutes = useMemo<Record<string, HuntRoute>>(() => ({
    ...ICAT_2026_HUNT_DATA.routes,
    ...(hunt.routes || {}),
    ...localRoutes,
  }), [hunt.routes, localRoutes]);

  // Authoritative server fetch for secrets and custom rooms
  const fetchAuthoritativeData = useCallback(async () => {
    setIsFetchingSecrets(true);
    try {
      const res = await fetch(`/api/admin/update-hunt?huntId=${hunt.id || "icat-2026"}`, {
        headers: {
          "x-admin-passcode": "ZxAlpha98007!",
          Authorization: `Bearer ${idToken || ""}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        if (data.secrets) {
          setLiveSecrets(data.secrets);
        }
        if (data.secretsMap) {
          setSecretsMap(data.secretsMap);
        }
        if (data.hunt?.nodes) {
          setLocalNodes((prev) => ({ ...prev, ...data.hunt.nodes }));
        }
        if (data.hunt?.routes) {
          setLocalRoutes((prev) => ({ ...prev, ...data.hunt.routes }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch authoritative admin secrets:", err);
    } finally {
      setIsFetchingSecrets(false);
    }
  }, [hunt.id, idToken]);

  useEffect(() => {
    fetchAuthoritativeData();
  }, [fetchAuthoritativeData]);

  // Instant update callback from RoutePathStudio
  const handleHuntUpdate = useCallback((update: {
    nodes?: Record<string, HuntNode>;
    routes?: Record<string, HuntRoute>;
    secretsMap?: Record<string, string>;
    liveSecrets?: Record<string, { code: string }>;
  }) => {
    if (update.nodes) {
      setLocalNodes((prev) => ({ ...prev, ...update.nodes }));
    }
    if (update.routes) {
      setLocalRoutes((prev) => ({ ...prev, ...update.routes }));
    }
    if (update.secretsMap) {
      setSecretsMap((prev) => ({ ...prev, ...update.secretsMap }));
    }
    if (update.liveSecrets) {
      setLiveSecrets((prev) => ({ ...prev, ...update.liveSecrets }));
    }
  }, []);

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
          "x-admin-passcode": "ZxAlpha98007!",
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

  // Helper to get the most up-to-date cipher code for any node/route combination
  const getCipherCode = (rId: string | null, nodeId: string): string => {
    if (rId) {
      const routeKey = `${rId}_${nodeId}`;
      if (secretsMap[routeKey]) return secretsMap[routeKey];
      if (liveSecrets[routeKey]?.code) return liveSecrets[routeKey].code;
      const raw = liveSecrets[routeKey] as unknown;
      if (typeof raw === "string" && raw) return raw;
      if (ICAT_2026_SECRETS.codes[routeKey]?.code) return ICAT_2026_SECRETS.codes[routeKey].code;
    }
    if (secretsMap[nodeId]) return secretsMap[nodeId];
    if (liveSecrets[nodeId]?.code) return liveSecrets[nodeId].code;
    const rawGlobal = liveSecrets[nodeId] as unknown;
    if (typeof rawGlobal === "string" && rawGlobal) return rawGlobal;
    if (ICAT_2026_SECRETS.codes[nodeId]?.code) return ICAT_2026_SECRETS.codes[nodeId].code;
    return "CODE" + nodeId;
  };

  // Filtered nodes list for table search
  const filteredNodeList = useMemo(() => {
    const all = Object.values(effectiveNodes);
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase().trim();
    return all.filter((n) => {
      const matchId = n.id.toLowerCase().includes(q);
      const matchName = n.name.toLowerCase().includes(q);
      const matchFloor = n.floorId?.toLowerCase().includes(q);
      const matchCode = Object.keys(effectiveRoutes).some((rId) =>
        getCipherCode(rId, n.id).toLowerCase().includes(q)
      );
      return matchId || matchName || matchFloor || matchCode;
    });
  }, [effectiveNodes, effectiveRoutes, searchQuery, secretsMap, liveSecrets]);

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

          <div className="flex items-center gap-3">
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
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Real-time Telemetry Leaderboard */}
          <LiveLeaderboard hunt={hunt} idToken={idToken} />

          {/* Unified Path & Room Riddle Studio with Live State Sync */}
          <RoutePathStudio
            hunt={{ ...hunt, nodes: effectiveNodes, routes: effectiveRoutes }}
            idToken={idToken}
            onRefresh={fetchAuthoritativeData}
            onHuntUpdate={handleHuntUpdate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Seeder */}
            <QuickSeeder idToken={idToken} onSeeded={fetchAuthoritativeData} />

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
                    {Object.values(hunt?.teams || {}).map((t) => (
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
                    {Object.values(effectiveRoutes).map((r) => (
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
                  className="w-full font-bold"
                >
                  APPLY ROUTE REASSIGNMENT
                </CyberButton>
              </form>
            </CyberCard>
          </div>

          {/* Master Faculty & Organizer Secret Reference Table with Instant Realtime Sync */}
          <CyberCard className="p-6 space-y-4 border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-base text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <span>FACULTY & ORGANIZER CLEARANCE DIRECTORY (CONFIDENTIAL)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 font-bold">
                      LIVE DIRECTORY
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Master authoritative key of all rooms, active paths, and secret cipher unlock codes.
                  </p>
                </div>
              </div>

              {/* Search & Refresh Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search room / code..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 bg-[#050814] text-slate-200 text-xs focus:border-cyan-500 focus:outline-none w-48 sm:w-60"
                  />
                </div>

                <CyberButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={isFetchingSecrets}
                  onClick={fetchAuthoritativeData}
                  className="text-xs font-bold"
                  title="Reload authoritative secrets from cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSecrets ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline ml-1">REFRESH</span>
                </CyberButton>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 px-2">SECTOR ID</th>
                    <th className="pb-2 px-2">ROOM NAME</th>
                    <th className="pb-2 px-2">FLOOR</th>
                    <th className="pb-2 px-2">SOURCE</th>
                    <th className="pb-2 px-2">PATH ASSIGNMENT & SECRET CODES</th>
                    <th className="pb-2 px-2">PUZZLE PIECE CONFIG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredNodeList.map((n) => {
                    const assignedRoutes = Object.keys(effectiveRoutes).filter((rId) =>
                      effectiveRoutes[rId]?.nodes?.includes(n.id)
                    );

                    return (
                      <tr key={n.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-cyan-400">{n.id}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-200">{n.name}</div>
                          {n.riddle?.text && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3 flex-shrink-0 text-slate-600" />
                              <span className="truncate">{n.riddle.text}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 uppercase font-bold text-slate-400">
                          {n.floorId ? n.floorId.replace("floor-", "FL-").toUpperCase() : "FL-1"}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                            n.type === "BOSS"
                              ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                              : n.type === "FINAL"
                              ? "border-yellow-500/50 bg-yellow-950/60 text-yellow-300"
                              : "border-slate-700 bg-slate-900/80 text-slate-300"
                          }`}>
                            {n.codeSource}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-bold">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {assignedRoutes.length > 0 ? (
                              assignedRoutes.map((rId) => {
                                const code = getCipherCode(rId, n.id);
                                return (
                                  <span
                                    key={rId}
                                    className="px-2 py-1 rounded bg-black/90 border border-amber-500/40 text-[11px] flex items-center gap-1.5 shadow-sm"
                                  >
                                    <span className="text-cyan-400 font-black">{rId}:</span>
                                    <span className="text-amber-300 font-black tracking-wider">{code}</span>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="px-2 py-1 rounded bg-black/60 border border-slate-700 text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-slate-500">GLOBAL:</span>
                                <span className="text-amber-300 font-black tracking-wider">
                                  {getCipherCode(null, n.id)}
                                </span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="space-y-1">
                            {assignedRoutes.map((rId) => {
                              const routePuzzle = n.routePuzzleLocations?.[rId];
                              const pieceId = routePuzzle?.pieceId || n.puzzleLocation?.pieceId;
                              const clue = routePuzzle?.clue || n.puzzleLocation?.clue;

                              if (!pieceId && !clue) return null;

                              return (
                                <div key={rId} className="flex items-center gap-1.5 text-[10px]">
                                  <span className="text-cyan-400 font-bold">{rId}:</span>
                                  <span className="px-1.5 py-0.2 rounded border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 font-bold flex items-center gap-1">
                                    <Puzzle className="w-2.5 h-2.5" />
                                    <span>{pieceId || "PIECE"}</span>
                                  </span>
                                  {clue && <span className="text-slate-400 truncate max-w-[140px]">({clue})</span>}
                                </div>
                              );
                            })}
                            {!assignedRoutes.some((rId) => n.routePuzzleLocations?.[rId]?.pieceId || n.puzzleLocation?.pieceId) && (
                              <span className="text-slate-600 text-[10px]">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredNodeList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                        No rooms match the search query &ldquo;{searchQuery}&rdquo;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CyberCard>
        </div>
      </div>
    </AdminPasswordGate>
  );
}


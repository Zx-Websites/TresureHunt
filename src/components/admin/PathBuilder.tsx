"use client";

import React, { useState } from "react";
import { Hunt, HuntNode, HuntRoute } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA } from "@/lib/game-engine/icat-2026-seed-data";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  Route,
  Plus,
  Trash2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  MapPin,
  Flag,
  Crosshair,
} from "lucide-react";

interface PathBuilderProps {
  hunt: Hunt;
  idToken?: string | null;
  onRefresh?: () => void;
}

export function PathBuilder({ hunt, idToken, onRefresh }: PathBuilderProps) {
  const [activeRouteId, setActiveRouteId] = useState<string>("P1");
  const [customRouteId, setCustomRouteId] = useState("");
  const [customRouteName, setCustomRouteName] = useState("");
  const [isCreatingNewRoute, setIsCreatingNewRoute] = useState(false);

  // Fallback to official 20 rooms if hunt data has not yet been re-seeded
  const effectiveNodes = {
    ...ICAT_2026_HUNT_DATA.nodes,
    ...(hunt.nodes || {}),
  };

  const effectiveRoutes = {
    ...ICAT_2026_HUNT_DATA.routes,
    ...(hunt.routes || {}),
  };

  // Node creation modal
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeName, setNewNodeName] = useState("");
  const [newFloorId, setNewFloorId] = useState("floor-1");
  const [newNodeType, setNewNodeType] = useState<"NORMAL" | "BOSS" | "FINAL">("NORMAL");
  const [newCodeSource, setNewCodeSource] = useState<"TEACHER" | "HIDDEN" | "MINIGAME">("HIDDEN");
  const [newSecretCode, setNewSecretCode] = useState("");
  const [newRiddleText, setNewRiddleText] = useState("");
  const [newPuzzleClue, setNewPuzzleClue] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentRoute = effectiveRoutes[activeRouteId] || {
    id: activeRouteId,
    name: `Route ${activeRouteId}`,
    nodes: [],
  };

  const [nodesList, setNodesList] = useState<string[]>(currentRoute.nodes || []);

  // Update nodesList when activeRouteId changes
  React.useEffect(() => {
    if (effectiveRoutes[activeRouteId]) {
      setNodesList(effectiveRoutes[activeRouteId].nodes || []);
    }
  }, [activeRouteId, hunt.routes]);

  const handleAddNodeToRoute = (nodeKey: string) => {
    soundFx.playClick();
    setNodesList([...nodesList, nodeKey]);
  };

  const handleRemoveNode = (index: number) => {
    soundFx.playClick();
    const updated = [...nodesList];
    updated.splice(index, 1);
    setNodesList(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    soundFx.playClick();
    const updated = [...nodesList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setNodesList(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === nodesList.length - 1) return;
    soundFx.playClick();
    const updated = [...nodesList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setNodesList(updated);
  };

  const handleSaveRoute = async () => {
    soundFx.playClick();
    setIsSaving(true);
    setStatusMsg(null);

    const updatedRoute: HuntRoute = {
      id: activeRouteId,
      name: currentRoute.name || `Route ${activeRouteId}`,
      nodes: nodesList,
    };

    try {
      const res = await fetch("/api/admin/update-hunt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: hunt.id,
          action: "SAVE_ROUTE",
          route: updatedRoute,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({ type: "success", text: data.message });
        if (onRefresh) onRefresh();
      } else {
        soundFx.playAccessDenied();
        setStatusMsg({ type: "error", text: data.error || "Failed to save route." });
      }
    } catch {
      soundFx.playAccessDenied();
      setStatusMsg({ type: "error", text: "Network connection failure." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRouteId.trim()) return;

    soundFx.playClick();
    const newId = customRouteId.trim().toUpperCase();
    const newName = customRouteName.trim() || `Route ${newId}`;

    effectiveRoutes[newId] = {
      id: newId,
      name: newName,
      nodes: ["202"],
    };

    setActiveRouteId(newId);
    setNodesList(["202"]);
    setIsCreatingNewRoute(false);
    setCustomRouteId("");
    setCustomRouteName("");
  };

  const handleSaveNewNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeId.trim() || !newNodeName.trim()) return;

    soundFx.playClick();
    setIsSaving(true);

    const targetNode: HuntNode = {
      id: newNodeId.trim(),
      name: newNodeName.trim(),
      floorId: newFloorId,
      type: newNodeType,
      position: { x: 50, y: 50 },
      riddle: {
        title: `Sector ${newNodeId.trim()} Clue`,
        text: newRiddleText.trim() || "Investigate the coordinates to locate the clearance token.",
      },
      codeSource: newCodeSource,
      nextNodes: [],
      puzzleLocation: newPuzzleClue.trim()
        ? {
            clue: newPuzzleClue.trim(),
            pieceId: `PIECE_${newNodeId.trim().toUpperCase().replace(/[\s.-]+/g, "_")}`,
          }
        : undefined,
      minigame:
        newNodeType === "BOSS"
          ? {
              gameId: `${newNodeId.trim()}_GAME`,
              minimumScore: 850,
              title: "Mainframe Override",
            }
          : undefined,
    };

    try {
      const res = await fetch("/api/admin/update-hunt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken || ""}`,
        },
        body: JSON.stringify({
          huntId: hunt.id,
          action: "SAVE_NODE",
          node: targetNode,
          secretCode: newSecretCode.trim() || "CYBERCODE",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setShowNodeModal(false);
        setNewNodeId("");
        setNewNodeName("");
        setNewSecretCode("");
        setNewRiddleText("");
        setNewPuzzleClue("");
        if (onRefresh) onRefresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // The Official 20 Campus Rooms
  const official20RoomKeys = [
    "202",
    "Vice principal cabin",
    "401B",
    "Staff room",
    "306",
    "Staff Lunch",
    "Game Lounge",
    "Audi",
    "201",
    "F.L.",
    "401A",
    "Textile Lab",
    "503",
    "305",
    "402",
    "Library",
    "Canteen",
    "Reception",
    "Photo Lab",
    "206",
  ];

  return (
    <CyberCard className="p-6 space-y-6 border-cyan-500/40 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Route className="w-5 h-5" />
          <div>
            <h2 className="font-black text-base text-slate-100 uppercase tracking-wider">
              DYNAMIC PATH FLOW BUILDER (20 CAMPUS ROOMS)
            </h2>
            <p className="text-xs text-slate-400">
              Customize starting point, boss stage (401A), post-boss rooms, and final treasure vault
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <CyberButton
            onClick={() => setShowNodeModal(true)}
            variant="green"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            CREATE CUSTOM ROOM
          </CyberButton>
          <CyberButton
            onClick={() => setIsCreatingNewRoute(true)}
            variant="cyan"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            NEW ROUTE (P4...)
          </CyberButton>
        </div>
      </div>

      {/* Route Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.values(effectiveRoutes).map((r) => {
          const isActive = r.id === activeRouteId;
          return (
            <button
              key={r.id}
              onClick={() => {
                soundFx.playClick();
                setActiveRouteId(r.id);
              }}
              className={`px-3 py-1.5 rounded border text-xs font-bold transition-all ${
                isActive
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  : "border-slate-800 bg-[#070B19] text-slate-400 hover:text-slate-200"
              }`}
            >
              {r.name || `Route ${r.id}`} ({r.nodes?.length || 0} Stages)
            </button>
          );
        })}
      </div>

      {/* Visual Sequence Flowchart */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">PATH SEQUENCE ({activeRouteId}):</span>
            <span className="text-cyan-400 font-bold">{nodesList.length} STAGES</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <MapPin className="w-3.5 h-3.5" /> Start: {nodesList[0] || "None"}
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Crosshair className="w-3.5 h-3.5" /> Boss: 401A
            </span>
            <span className="flex items-center gap-1 text-yellow-400 font-bold">
              <Flag className="w-3.5 h-3.5" /> Vault: {nodesList[nodesList.length - 1] || "None"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#050811] flex flex-wrap items-center gap-2 min-h-[120px] max-h-[340px] overflow-y-auto">
          {nodesList.map((nodeId, idx) => {
            const node = effectiveNodes[nodeId];
            const isFirst = idx === 0;
            const isLast = idx === nodesList.length - 1;
            const isBoss = nodeId === "401A" || node?.type === "BOSS";
            const isFinal = isLast || node?.type === "FINAL";

            return (
              <React.Fragment key={`${nodeId}-${idx}`}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isBoss
                      ? "border-amber-400/80 bg-amber-950/60 text-amber-200 shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                      : isFinal
                      ? "border-yellow-400/80 bg-yellow-950/60 text-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                      : isFirst
                      ? "border-emerald-400/80 bg-emerald-950/60 text-emerald-200"
                      : "border-slate-700 bg-slate-900/90 text-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                  <div>
                    <p className="text-xs font-black truncate max-w-[130px]">{node?.name || nodeId}</p>
                    <span className="text-[9px] text-cyan-400 uppercase font-bold">
                      {node?.floorId ? `FL ${node.floorId.replace("floor-", "")}` : "LEVEL"}
                      {isBoss ? " • BOSS" : isFirst ? " • START" : isFinal ? " • VAULT" : ""}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 ml-1 border-l border-slate-700/60 pl-1.5">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={isFirst}
                      title="Move Earlier in Route"
                      className="p-0.5 text-slate-400 hover:text-cyan-300 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={isLast}
                      title="Move Later in Route"
                      className="p-0.5 text-slate-400 hover:text-cyan-300 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveNode(idx)}
                    title="Remove from Route"
                    className="p-1 text-slate-500 hover:text-rose-400 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!isLast && <ArrowRight className="w-4 h-4 text-cyan-500/60 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* The 20 Campus Rooms Quick Palette */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>THE 20 CAMPUS ROOMS (CLICK ANY ROOM TO APPEND TO {activeRouteId}):</span>
          </span>
          <span className="text-slate-400 text-[11px]">20 Total Options</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {official20RoomKeys.map((k) => {
            const n = effectiveNodes[k] || { id: k, name: k, floorId: "floor-1" };
            const inCurrentRoute = nodesList.includes(k);
            const countInRoute = nodesList.filter((id) => id === k).length;
            const isBoss = k === "401A";
            const isStart = k === "202";
            const isAudi = k === "Audi";

            return (
              <button
                key={k}
                onClick={() => handleAddNodeToRoute(k)}
                className={`p-2.5 rounded-lg border text-left font-mono transition-all text-xs hover:border-cyan-400 hover:bg-cyan-950/40 group relative ${
                  isBoss
                    ? "border-amber-500/60 bg-amber-950/30 text-amber-200"
                    : isAudi
                    ? "border-yellow-500/60 bg-yellow-950/30 text-yellow-200"
                    : isStart
                    ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"
                    : inCurrentRoute
                    ? "border-cyan-500/40 bg-slate-900/90 text-cyan-200"
                    : "border-slate-800 bg-[#070B19]/80 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">
                    FL {n.floorId.replace("floor-", "")}
                  </span>
                  {countInRoute > 0 ? (
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] text-cyan-300 font-bold">
                      x{countInRoute}
                    </span>
                  ) : isBoss ? (
                    <span className="text-[9px] text-amber-400 font-bold">BOSS</span>
                  ) : null}
                </div>
                <p className="font-bold truncate text-xs group-hover:text-cyan-300">{n.name}</p>
                <span className="text-[10px] text-slate-400 block truncate">ID: {k}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Reorder stages with arrows, or click any room above to append to {activeRouteId}.
        </p>

        <div className="flex gap-2 w-full sm:w-auto">
          <CyberButton
            onClick={handleSaveRoute}
            loading={isSaving}
            variant="green"
            size="md"
            className="w-full sm:w-auto font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            SAVE & PUBLISH ROUTE {activeRouteId}
          </CyberButton>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 p-3 rounded text-xs border ${
            statusMsg.type === "success"
              ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
              : "border-rose-500/50 bg-rose-950/60 text-rose-300"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Modal: Create New Route */}
      {isCreatingNewRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewRoute}
            className="w-full max-w-md rounded-xl border border-cyan-400 bg-[#070B19] p-6 space-y-4 shadow-[0_0_30px_rgba(0,240,255,0.3)] text-xs"
          >
            <h3 className="font-bold text-base text-slate-100 uppercase tracking-wider">
              CREATE NEW ROUTE
            </h3>

            <div>
              <label className="block text-slate-400 mb-1">Route Identifier</label>
              <input
                type="text"
                placeholder="e.g. P4"
                value={customRouteId}
                onChange={(e) => setCustomRouteId(e.target.value.toUpperCase())}
                required
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Route Title</label>
              <input
                type="text"
                placeholder="e.g. Route Delta (P4)"
                value={customRouteName}
                onChange={(e) => setCustomRouteName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <CyberButton type="submit" variant="cyan" size="sm" className="flex-1">
                CREATE ROUTE
              </CyberButton>
              <CyberButton
                type="button"
                onClick={() => setIsCreatingNewRoute(false)}
                variant="ghost"
                size="sm"
              >
                CANCEL
              </CyberButton>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create New Custom Node */}
      {showNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveNewNode}
            className="w-full max-w-lg rounded-xl border border-cyan-400 bg-[#070B19] p-6 space-y-3.5 shadow-[0_0_30px_rgba(0,240,255,0.3)] text-xs max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-bold text-base text-slate-100 uppercase tracking-wider border-b border-slate-800 pb-2">
              CREATE NEW CAMPUS SECTOR
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Room / Sector ID</label>
                <input
                  type="text"
                  placeholder="e.g. 308 or Studio-A"
                  value={newNodeId}
                  onChange={(e) => setNewNodeId(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Room Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Room 308 - Animation Studio"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  required
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Campus Floor</label>
                <select
                  value={newFloorId}
                  onChange={(e) => setNewFloorId(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="floor-1">Floor 1</option>
                  <option value="floor-2">Floor 2</option>
                  <option value="floor-3">Floor 3</option>
                  <option value="floor-4">Floor 4</option>
                  <option value="floor-5">Floor 5</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sector Type</label>
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value as "NORMAL" | "BOSS" | "FINAL")}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="NORMAL">Normal Room</option>
                  <option value="BOSS">Boss Encounter</option>
                  <option value="FINAL">Final Vault</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Code Source</label>
                <select
                  value={newCodeSource}
                  onChange={(e) => setNewCodeSource(e.target.value as "TEACHER" | "HIDDEN" | "MINIGAME")}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="TEACHER">Teacher Present</option>
                  <option value="HIDDEN">Hidden in Room</option>
                  <option value="MINIGAME">Minigame/Arcade</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Secret Clearance Cipher</label>
              <input
                type="text"
                placeholder="e.g. CIPHER308"
                value={newSecretCode}
                onChange={(e) => setNewSecretCode(e.target.value.toUpperCase())}
                required
                className="w-full rounded border border-amber-500/40 bg-slate-900 px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Riddle Clue Text</label>
              <textarea
                rows={2}
                placeholder="e.g. Where storyboards line the north corridor..."
                value={newRiddleText}
                onChange={(e) => setNewRiddleText(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Physical Puzzle Piece Location Clue</label>
              <input
                type="text"
                placeholder="e.g. Fragment cached behind the drawing easel in Room 308."
                value={newPuzzleClue}
                onChange={(e) => setNewPuzzleClue(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <CyberButton type="submit" loading={isSaving} variant="green" size="sm" className="flex-1">
                SAVE NODE TO DATABASE
              </CyberButton>
              <CyberButton
                type="button"
                onClick={() => setShowNodeModal(false)}
                variant="ghost"
                size="sm"
              >
                CANCEL
              </CyberButton>
            </div>
          </form>
        </div>
      )}
    </CyberCard>
  );
}

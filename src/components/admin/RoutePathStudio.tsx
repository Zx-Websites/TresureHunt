"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Hunt, HuntNode, HuntRoute, NodeType, CodeSource } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { CyberCard } from "@/components/ui/CyberCard";
import { CyberButton } from "@/components/ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  Route,
  KeyRound,
  FileEdit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Puzzle,
  AlertCircle,
  Zap,
} from "lucide-react";

interface RoutePathStudioProps {
  hunt: Hunt;
  idToken: string | null;
  onRefresh?: () => void;
}

export function RoutePathStudio({ hunt, idToken, onRefresh }: RoutePathStudioProps) {
  // Merge live hunt routes with seed routes
  const effectiveRoutes: Record<string, HuntRoute> = {
    ...ICAT_2026_HUNT_DATA.routes,
    ...(hunt.routes || {}),
  };

  const effectiveNodes: Record<string, HuntNode> = {
    ...ICAT_2026_HUNT_DATA.nodes,
    ...(hunt.nodes || {}),
  };

  const routeIds = Object.keys(effectiveRoutes);
  const [activeRouteId, setActiveRouteId] = useState<string>(routeIds[0] || "P1");

  // Local editable state for current route
  const currentRoute = effectiveRoutes[activeRouteId] || {
    id: activeRouteId,
    name: `Route ${activeRouteId}`,
    nodes: [],
  };

  // State of all route secrets (loaded or seeded)
  const [secretsMap, setSecretsMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    Object.entries(ICAT_2026_SECRETS.codes).forEach(([k, v]) => {
      map[k] = v.code;
    });
    return map;
  });

  // State of local nodes
  const [localNodes, setLocalNodes] = useState<Record<string, HuntNode>>(effectiveNodes);

  // Sync state with incoming props
  useEffect(() => {
    setLocalNodes((prev) => ({
      ...prev,
      ...hunt.nodes,
    }));
  }, [hunt.nodes]);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced" | "error">("synced");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Quick Room Adder Modal / dropdown state
  const [selectedAddNodeId, setSelectedAddNodeId] = useState<string>("");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomFloorId, setNewRoomFloorId] = useState("floor-2");
  const [newRoomType, setNewRoomType] = useState<NodeType>("NORMAL");

  // Expanded room accordion items
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Debounced Auto-Save Ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Automated Realtime Cloud Sync function
  const autoSaveToCloud = useCallback(
    async (
      routeToSave: HuntRoute,
      nodesToSave: Record<string, HuntNode>,
      secretsToSave: Record<string, string>
    ) => {
      setSyncStatus("saving");
      setSyncError(null);

      try {
        const res = await fetch("/api/admin/update-hunt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-passcode": "ZxAlpha98007!",
            Authorization: `Bearer ${idToken || ""}`,
          },
          body: JSON.stringify({
            huntId: hunt.id,
            action: "AUTO_SYNC_STUDIO",
            route: routeToSave,
            nodes: nodesToSave,
            secretsMap: secretsToSave,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSyncStatus("synced");
          if (onRefresh) onRefresh();
        } else {
          setSyncStatus("error");
          setSyncError(data.error || "Failed to auto-sync to cloud.");
        }
      } catch (err: unknown) {
        setSyncStatus("error");
        setSyncError("Network sync failure.");
      }
    },
    [hunt.id, idToken, onRefresh]
  );

  // Trigger debounced cloud sync whenever edits occur
  const triggerAutoSave = (
    updatedRoute: HuntRoute,
    updatedNodes: Record<string, HuntNode>,
    updatedSecrets: Record<string, string>
  ) => {
    setSyncStatus("saving");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      autoSaveToCloud(updatedRoute, updatedNodes, updatedSecrets);
    }, 600);
  };

  // Helper to get secret for a node in this route
  const getNodeSecret = (nodeId: string): string => {
    const routeSecretKey = `${activeRouteId}_${nodeId}`;
    if (secretsMap[routeSecretKey]) return secretsMap[routeSecretKey];
    if (secretsMap[nodeId]) return secretsMap[nodeId];
    return ICAT_2026_SECRETS.codes[routeSecretKey]?.code || ICAT_2026_SECRETS.codes[nodeId]?.code || "";
  };

  // Helper to get riddle for a node in this route
  const getNodeRiddle = (nodeId: string) => {
    const node = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!node) return { text: "", hint: "" };
    const routeRiddle = node.routeRiddles?.[activeRouteId];
    return {
      text: routeRiddle?.text || node.riddle?.text || "",
      hint: routeRiddle?.hint || node.riddle?.hint || "",
    };
  };

  // Helper to get puzzle location for a node in this route
  const getNodePuzzle = (nodeId: string) => {
    const node = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!node) return { clue: "", hint: "", pieceId: "" };
    const routePuzzle = node.routePuzzleLocations?.[activeRouteId];
    return {
      clue: routePuzzle?.clue || node.puzzleLocation?.clue || "",
      hint: routePuzzle?.hint || node.puzzleLocation?.hint || "",
      pieceId: routePuzzle?.pieceId || node.puzzleLocation?.pieceId || "",
    };
  };

  // 1. Update Riddle Text specifically for this route
  const handleUpdateRiddleText = (nodeId: string, text: string) => {
    const existingNode = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!existingNode) return;

    const currentRouteRiddles = existingNode.routeRiddles || {};
    const existingForRoute = currentRouteRiddles[activeRouteId] || existingNode.riddle || { text: "", hint: "" };

    const updatedNode: HuntNode = {
      ...existingNode,
      routeRiddles: {
        ...currentRouteRiddles,
        [activeRouteId]: {
          ...existingForRoute,
          text,
        },
      },
    };

    const newNodes = { ...localNodes, [nodeId]: updatedNode };
    setLocalNodes(newNodes);
    triggerAutoSave(currentRoute, newNodes, secretsMap);
  };

  // 2. Update Riddle Hint specifically for this route
  const handleUpdateRiddleHint = (nodeId: string, hint: string) => {
    const existingNode = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!existingNode) return;

    const currentRouteRiddles = existingNode.routeRiddles || {};
    const existingForRoute = currentRouteRiddles[activeRouteId] || existingNode.riddle || { text: "", hint: "" };

    const updatedNode: HuntNode = {
      ...existingNode,
      routeRiddles: {
        ...currentRouteRiddles,
        [activeRouteId]: {
          ...existingForRoute,
          hint,
        },
      },
    };

    const newNodes = { ...localNodes, [nodeId]: updatedNode };
    setLocalNodes(newNodes);
    triggerAutoSave(currentRoute, newNodes, secretsMap);
  };

  // 3. Update Cipher Code specifically for this route
  const handleUpdateCipherCode = (nodeId: string, rawCode: string) => {
    const routeSecretKey = `${activeRouteId}_${nodeId}`;
    const cleanCode = rawCode.trim().toUpperCase();

    const newSecrets = {
      ...secretsMap,
      [routeSecretKey]: cleanCode,
      [nodeId]: cleanCode,
    };

    setSecretsMap(newSecrets);
    triggerAutoSave(currentRoute, localNodes, newSecrets);
  };

  // 4. Update Puzzle Piece Clue / Location specifically for this route
  const handleUpdatePuzzleLocation = (nodeId: string, field: "clue" | "hint" | "pieceId", value: string) => {
    const existingNode = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!existingNode) return;

    const currentRoutePuzzles = existingNode.routePuzzleLocations || {};
    const existingForRoute = currentRoutePuzzles[activeRouteId] || existingNode.puzzleLocation || { clue: "", hint: "", pieceId: "" };

    const updatedNode: HuntNode = {
      ...existingNode,
      routePuzzleLocations: {
        ...currentRoutePuzzles,
        [activeRouteId]: {
          ...existingForRoute,
          [field]: value,
        },
      },
    };

    const newNodes = { ...localNodes, [nodeId]: updatedNode };
    setLocalNodes(newNodes);
    triggerAutoSave(currentRoute, newNodes, secretsMap);
  };

  // 5. Update Room Name
  const handleUpdateRoomName = (nodeId: string, name: string) => {
    const existingNode = localNodes[nodeId] || effectiveNodes[nodeId];
    if (!existingNode) return;

    const updatedNode: HuntNode = {
      ...existingNode,
      name,
    };

    const newNodes = { ...localNodes, [nodeId]: updatedNode };
    setLocalNodes(newNodes);
    triggerAutoSave(currentRoute, newNodes, secretsMap);
  };

  // 6. Add Existing Room into Current Path
  const handleAddRoomToPath = () => {
    if (!selectedAddNodeId) return;
    soundFx.playClick();

    const currentNodes = currentRoute.nodes || [];
    if (currentNodes.includes(selectedAddNodeId)) {
      alert(`Room ${selectedAddNodeId} is already in this path.`);
      return;
    }

    const updatedNodes = [...currentNodes, selectedAddNodeId];
    const updatedRoute: HuntRoute = {
      ...currentRoute,
      nodes: updatedNodes,
    };

    effectiveRoutes[activeRouteId] = updatedRoute;
    triggerAutoSave(updatedRoute, localNodes, secretsMap);
    setSelectedAddNodeId("");
    setExpandedRoomId(selectedAddNodeId);
  };

  // 7. Remove Room from Current Path
  const handleRemoveRoomFromPath = (indexToRemove: number) => {
    soundFx.playClick();
    const currentNodes = currentRoute.nodes || [];
    const updatedNodes = currentNodes.filter((_, idx) => idx !== indexToRemove);

    const updatedRoute: HuntRoute = {
      ...currentRoute,
      nodes: updatedNodes,
    };

    effectiveRoutes[activeRouteId] = updatedRoute;
    triggerAutoSave(updatedRoute, localNodes, secretsMap);
  };

  // 8. Reorder Room: Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    soundFx.playClick();
    const currentNodes = [...(currentRoute.nodes || [])];
    const temp = currentNodes[index - 1];
    currentNodes[index - 1] = currentNodes[index];
    currentNodes[index] = temp;

    const updatedRoute: HuntRoute = {
      ...currentRoute,
      nodes: currentNodes,
    };

    effectiveRoutes[activeRouteId] = updatedRoute;
    triggerAutoSave(updatedRoute, localNodes, secretsMap);
  };

  // 9. Reorder Room: Move Down
  const handleMoveDown = (index: number) => {
    const currentNodes = [...(currentRoute.nodes || [])];
    if (index >= currentNodes.length - 1) return;
    soundFx.playClick();
    const temp = currentNodes[index + 1];
    currentNodes[index + 1] = currentNodes[index];
    currentNodes[index] = temp;

    const updatedRoute: HuntRoute = {
      ...currentRoute,
      nodes: currentNodes,
    };

    effectiveRoutes[activeRouteId] = updatedRoute;
    triggerAutoSave(updatedRoute, localNodes, secretsMap);
  };

  // 10. Create Brand New Global Room
  const handleCreateNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomId.trim()) return;

    soundFx.playClick();
    const cleanId = newRoomId.trim().toUpperCase();
    const cleanName = newRoomName.trim() || `Room ${cleanId}`;

    const newNode: HuntNode = {
      id: cleanId,
      name: cleanName,
      floorId: newRoomFloorId,
      type: newRoomType,
      position: { x: 50, y: 50 },
      codeSource: newRoomType === "BOSS" ? "MINIGAME" : "HIDDEN",
      nextNodes: [],
      riddle: {
        title: `Clue to ${cleanName}`,
        text: `Decrypt the security cipher located inside ${cleanName}.`,
        hint: `Search near ${cleanName}.`,
      },
    };

    const newNodes = {
      ...localNodes,
      [cleanId]: newNode,
    };

    // Auto add to current route
    const updatedNodes = [...(currentRoute.nodes || []), cleanId];
    const updatedRoute: HuntRoute = {
      ...currentRoute,
      nodes: updatedNodes,
    };

    setLocalNodes(newNodes);
    setShowCreateRoomModal(false);
    setNewRoomId("");
    setNewRoomName("");
    setExpandedRoomId(cleanId);

    triggerAutoSave(updatedRoute, newNodes, secretsMap);
  };

  // 11. Create New Route Tab
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [newCustomRouteId, setNewCustomRouteId] = useState("");
  const [newCustomRouteName, setNewCustomRouteName] = useState("");

  const handleCreateNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomRouteId.trim()) return;

    soundFx.playClick();
    const cleanRouteId = newCustomRouteId.trim().toUpperCase();
    const cleanRouteName = newCustomRouteName.trim() || `Route ${cleanRouteId}`;

    const newRoute: HuntRoute = {
      id: cleanRouteId,
      name: cleanRouteName,
      nodes: ["202"], // Start with Genesis room by default
    };

    effectiveRoutes[cleanRouteId] = newRoute;
    setActiveRouteId(cleanRouteId);
    setShowNewRouteModal(false);
    setNewCustomRouteId("");
    setNewCustomRouteName("");

    triggerAutoSave(newRoute, localNodes, secretsMap);
  };

  const routeNodesList = currentRoute.nodes || [];
  const allAvailableNodeIds = Object.keys(localNodes).sort();

  return (
    <CyberCard className="p-4 sm:p-6 border-cyan-500/40 space-y-6">
      {/* Studio Header & Realtime Cloud Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>PATH & ROOM RIDDLE STUDIO</span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage sequential rooms, unique riddles, hints, and dedicated unlock ciphers per path.
            </p>
          </div>
        </div>

        {/* Realtime Sync Status Badge */}
        <div className="flex items-center gap-2">
          {syncStatus === "saving" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/80 text-cyan-300 text-xs font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>SYNCING DIRECTLY TO CLOUD...</span>
            </span>
          )}

          {syncStatus === "synced" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>REALTIME SYNCED (AUTOMATED)</span>
            </span>
          )}

          {syncStatus === "error" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/50 bg-rose-950/80 text-rose-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{syncError || "SYNC ERROR"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Path Tabs Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            SELECT PATH TO CONFIGURE:
          </span>
          <button
            onClick={() => setShowNewRouteModal(true)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ CREATE NEW PATH</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {routeIds.map((rId) => {
            const rData = effectiveRoutes[rId];
            const isActive = rId === activeRouteId;
            const nodeCount = rData?.nodes?.length || 0;

            return (
              <button
                key={rId}
                onClick={() => {
                  soundFx.playClick();
                  setActiveRouteId(rId);
                  setExpandedRoomId(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                  isActive
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)] scale-105"
                    : "border-slate-800 bg-[#070B1A] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <Route className={`w-3.5 h-3.5 ${isActive ? "text-cyan-300" : "text-slate-500"}`} />
                <span>{rData?.name || `Route ${rId}`}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {nodeCount} rooms
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Path Actions & Room Adder Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-[#050814]">
        {/* Left: Add Room to Path */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="text-xs text-slate-400 font-bold">ADD ROOM TO {activeRouteId}:</span>

          <select
            value={selectedAddNodeId}
            onChange={(e) => setSelectedAddNodeId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs font-bold focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- Choose Existing Room --</option>
            {allAvailableNodeIds.map((nId) => {
              const node = localNodes[nId];
              const isInCurrentPath = routeNodesList.includes(nId);
              return (
                <option key={nId} value={nId} disabled={isInCurrentPath}>
                  {node?.name || nId} ({nId}) {isInCurrentPath ? "✓ (In Path)" : ""}
                </option>
              );
            })}
          </select>

          <CyberButton
            onClick={handleAddRoomToPath}
            disabled={!selectedAddNodeId}
            size="sm"
            variant="cyan"
            className="text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD TO PATH</span>
          </CyberButton>

          <button
            onClick={() => setShowCreateRoomModal(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>NEW CUSTOM ROOM</span>
          </button>
        </div>

        {/* Right: Path Info */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Total Stages:</span>
          <span className="text-cyan-300 font-black">{routeNodesList.length} Stages</span>
        </div>
      </div>

      {/* Sequential Ordered Rooms List for Active Path */}
      <div className="space-y-3">
        {routeNodesList.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 bg-[#050814] space-y-2">
            <p className="text-sm text-slate-400 font-bold">No rooms added to {activeRouteId} yet.</p>
            <p className="text-xs text-slate-500">Select a room from the dropdown above to start building this path.</p>
          </div>
        ) : (
          routeNodesList.map((nodeId, idx) => {
            const nodeData = localNodes[nodeId] || effectiveNodes[nodeId];
            const riddleData = getNodeRiddle(nodeId);
            const cipherCode = getNodeSecret(nodeId);
            const puzzleData = getNodePuzzle(nodeId);

            const isExpanded = expandedRoomId === nodeId;
            const isBoss = nodeId === "401A" || nodeData?.type === "BOSS";
            const isFinal = idx === routeNodesList.length - 1 || nodeData?.type === "FINAL";
            const hasPiece = !!puzzleData.pieceId || (idx >= 1 && idx <= 6);

            return (
              <div
                key={`${nodeId}-${idx}`}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isExpanded
                    ? "border-cyan-400/80 bg-[#070C1E] shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                    : "border-slate-800/80 bg-[#050917] hover:border-slate-700"
                }`}
              >
                {/* Accordion Row Header */}
                <div
                  onClick={() => {
                    soundFx.playClick();
                    setExpandedRoomId(isExpanded ? null : nodeId);
                  }}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  {/* Left: Stage Number, Room Name, Badges */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                        isBoss
                          ? "border-amber-400 bg-amber-950/60 text-amber-300"
                          : isFinal
                          ? "border-yellow-400 bg-yellow-950/60 text-yellow-300"
                          : "border-cyan-500/40 bg-cyan-950/40 text-cyan-300"
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-100 tracking-wide">
                          {nodeData?.name || nodeId}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">({nodeId})</span>

                        {isBoss && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold border border-amber-500/50 bg-amber-950/60 text-amber-300">
                            BOSS (400 PTS PC)
                          </span>
                        )}

                        {isFinal && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold border border-yellow-500/50 bg-yellow-950/60 text-yellow-300">
                            GRAND VAULT
                          </span>
                        )}

                        {hasPiece && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-bold border border-emerald-500/40 bg-emerald-950/60 text-emerald-300">
                            <Puzzle className="w-3 h-3" />
                            <span>Piece #{idx >= 1 && idx <= 6 ? idx : puzzleData.pieceId || "X"}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                        <span className="text-slate-500">Riddle: </span>
                        <span className="text-slate-300">{riddleData.text || "No riddle configured"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cipher Code Preview & Reorder / Delete Controls */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Cipher Code Badge */}
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-black/60 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-500 text-[10px]">CODE:</span>
                      <span className="text-amber-300 font-black tracking-wider">{cipherCode || "NOT SET"}</span>
                    </div>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      title="Move earlier in path"
                      className="p-1.5 rounded-lg border border-slate-800 bg-[#070B1A] text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === routeNodesList.length - 1}
                      title="Move later in path"
                      className="p-1.5 rounded-lg border border-slate-800 bg-[#070B1A] text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove from Path */}
                    <button
                      onClick={() => handleRemoveRoomFromPath(idx)}
                      title="Remove room from this path"
                      className="p-1.5 rounded-lg border border-slate-800 bg-[#070B1A] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand/Collapse Chevron */}
                    <button
                      onClick={() => setExpandedRoomId(isExpanded ? null : nodeId)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Editor Form for this Room on this Path */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-black/40 space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left Column: Room Name & Dedicated Route Riddle */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-1">
                            ROOM NAME (VISIBLE ON MAP & HUD)
                          </label>
                          <input
                            type="text"
                            value={nodeData?.name || ""}
                            onChange={(e) => handleUpdateRoomName(nodeId, e.target.value)}
                            placeholder="e.g. Staff Room 202"
                            className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#050814] text-slate-200 text-xs font-bold focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-cyan-300 block mb-1 flex items-center justify-between">
                            <span>RIDDLE CLUE FOR PATH {activeRouteId}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              Students solve this to locate {nodeData?.name || nodeId}
                            </span>
                          </label>
                          <textarea
                            rows={3}
                            value={riddleData.text}
                            onChange={(e) => handleUpdateRiddleText(nodeId, e.target.value)}
                            placeholder={`Enter the riddle clue specifically for squad on ${activeRouteId}...`}
                            className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#050814] text-slate-200 text-xs font-sans focus:border-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-400 block mb-1">
                            OPTIONAL HINT FOR PATH {activeRouteId}
                          </label>
                          <input
                            type="text"
                            value={riddleData.hint}
                            onChange={(e) => handleUpdateRiddleHint(nodeId, e.target.value)}
                            placeholder="e.g. Near the main corridor whiteboard"
                            className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#050814] text-slate-200 text-xs font-sans focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Right Column: Route-Specific Cipher Code & Puzzle Piece */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-amber-300 block mb-1 flex items-center justify-between">
                            <span>SECRET CIPHER CODE FOR PATH {activeRouteId}</span>
                            <span className="text-[10px] text-amber-400/80 font-normal">
                              Unique to this room on {activeRouteId}
                            </span>
                          </label>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={cipherCode}
                              onChange={(e) => handleUpdateCipherCode(nodeId, e.target.value)}
                              placeholder="e.g. CIPHER123"
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-amber-500/40 bg-[#050814] text-amber-300 text-xs font-black tracking-wider focus:border-amber-400 focus:outline-none uppercase"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Only this code will decrypt Stage #{idx + 1} for squads on {activeRouteId}.
                          </p>
                        </div>

                        {/* Physical Puzzle Piece Location (Stages 2-7) */}
                        <div className="p-3 rounded-xl border border-slate-800 bg-[#050814] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>PHYSICAL PUZZLE PIECE CONFIGURATION</span>
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Stage #{idx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">FRAGMENT ID</label>
                              <input
                                type="text"
                                value={puzzleData.pieceId || (idx >= 1 && idx <= 6 ? `FRAGMENT-0${idx}` : "")}
                                onChange={(e) => handleUpdatePuzzleLocation(nodeId, "pieceId", e.target.value)}
                                placeholder="e.g. FRAGMENT-01"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-black/60 text-emerald-300 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">HIDDEN LOCATION CLUE</label>
                              <input
                                type="text"
                                value={puzzleData.clue || ""}
                                onChange={(e) => handleUpdatePuzzleLocation(nodeId, "clue", e.target.value)}
                                placeholder="e.g. Hidden under desk drawer"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Zap className="w-3 h-3 animate-pulse" />
                        Changes save automatically to Cloud Database.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Custom Room */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CyberCard className="max-w-md w-full p-6 border-cyan-400 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wider">
                CREATE NEW CUSTOM ROOM
              </h3>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewRoom} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">ROOM ID / CODE</label>
                <input
                  type="text"
                  required
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="e.g. 305B, LAB4, ROOF"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-cyan-300 text-xs font-bold focus:border-cyan-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">ROOM DISPLAY NAME</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Robotics Lab 305B"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">FLOOR</label>
                  <select
                    value={newRoomFloorId}
                    onChange={(e) => setNewRoomFloorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="floor-1">1st Floor</option>
                    <option value="floor-2">2nd Floor</option>
                    <option value="floor-3">3rd Floor</option>
                    <option value="floor-4">4th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">ROOM TYPE</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value as NodeType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="NORMAL">Standard Room</option>
                    <option value="BOSS">Boss Encounter (401A)</option>
                    <option value="FINAL">Final Treasure Vault</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <CyberButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateRoomModal(false)}
                >
                  Cancel
                </CyberButton>
                <CyberButton type="submit" variant="cyan" size="sm">
                  Create & Add to Path
                </CyberButton>
              </div>
            </form>
          </CyberCard>
        </div>
      )}

      {/* Modal: Create Custom Route Tab */}
      {showNewRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CyberCard className="max-w-md w-full p-6 border-cyan-400 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wider">
                CREATE NEW PATH
              </h3>
              <button
                onClick={() => setShowNewRouteModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewRoute} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">PATH IDENTIFIER</label>
                <input
                  type="text"
                  required
                  value={newCustomRouteId}
                  onChange={(e) => setNewCustomRouteId(e.target.value)}
                  placeholder="e.g. P4, P5, ROUTE_OMEGA"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-cyan-300 text-xs font-bold focus:border-cyan-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">PATH DISPLAY NAME</label>
                <input
                  type="text"
                  value={newCustomRouteName}
                  onChange={(e) => setNewCustomRouteName(e.target.value)}
                  placeholder="e.g. Route P4 - Shadow Protocol"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-black/60 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <CyberButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewRouteModal(false)}
                >
                  Cancel
                </CyberButton>
                <CyberButton type="submit" variant="cyan" size="sm">
                  Create Path
                </CyberButton>
              </div>
            </form>
          </CyberCard>
        </div>
      )}
    </CyberCard>
  );
}

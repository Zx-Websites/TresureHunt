"use client";

import React, { useState, useEffect } from "react";
import { Hunt, HuntNode } from "@/lib/game-engine/types";
import { ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  FileText,
  KeyRound,
  Save,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Puzzle,
  Building2,
  Route,
  Shield,
} from "lucide-react";

interface RiddleAndCodeEditorProps {
  hunt: Hunt;
  idToken?: string | null;
  onRefresh?: () => void;
}

export function RiddleAndCodeEditor({ hunt, idToken, onRefresh }: RiddleAndCodeEditorProps) {
  const nodeKeys = Object.keys(hunt.nodes || {});
  const [selectedRouteId, setSelectedRouteId] = useState<string>("P1");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("Vice principal cabin");

  const currentNode: HuntNode = hunt.nodes[selectedNodeId] || {
    id: selectedNodeId,
    name: selectedNodeId,
    floorId: "floor-1",
    type: "NORMAL",
    position: { x: 50, y: 50 },
    riddle: {
      title: `Sector ${selectedNodeId} Clue`,
      text: "",
      hint: "",
    },
    codeSource: "HIDDEN",
    nextNodes: [],
  };

  // Check stage index in current route
  const currentRoute = hunt.routes[selectedRouteId];
  const stageIndexInRoute = currentRoute?.nodes?.indexOf(selectedNodeId);
  const stageNumber = stageIndexInRoute !== undefined && stageIndexInRoute !== -1 ? stageIndexInRoute + 1 : null;
  const isStartStage = selectedNodeId === "202" || stageNumber === 1;
  const isFinalStage = selectedNodeId === "Audi" || stageNumber === currentRoute?.nodes?.length;
  const isPuzzleStage = stageNumber !== null && stageNumber >= 2 && stageNumber <= 7;

  // Form State
  const [riddleTitle, setRiddleTitle] = useState("");
  const [riddleText, setRiddleText] = useState("");
  const [riddleHint, setRiddleHint] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [codeSource, setCodeSource] = useState<"TEACHER" | "HIDDEN" | "MINIGAME">("HIDDEN");
  const [puzzleClue, setPuzzleClue] = useState("");
  const [puzzlePieceId, setPuzzlePieceId] = useState("");
  const [minigameScore, setMinigameScore] = useState<number>(850);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state when selectedNodeId, selectedRouteId, or hunt changes
  useEffect(() => {
    const node = hunt.nodes[selectedNodeId];
    if (node) {
      const routeRiddle = node.routeRiddles?.[selectedRouteId] || node.riddle;
      const routeSecretKey = `${selectedRouteId}_${selectedNodeId}`;
      const code = ICAT_2026_SECRETS.codes[routeSecretKey]?.code || ICAT_2026_SECRETS.codes[selectedNodeId]?.code || "CIPHER";
      const routePuzzle = node.routePuzzleLocations?.[selectedRouteId] || node.puzzleLocation;

      setRiddleTitle(routeRiddle?.title || `Sector ${selectedNodeId} Clue (${selectedRouteId})`);
      setRiddleText(routeRiddle?.text || "");
      setRiddleHint(routeRiddle?.hint || "");
      setSecretCode(code);
      setCodeSource(node.codeSource || "HIDDEN");
      setPuzzleClue(routePuzzle?.clue || "");
      setPuzzlePieceId(routePuzzle?.pieceId || (isPuzzleStage ? `PIECE_${stageNumber - 1}` : ""));
      setMinigameScore(node.minigame?.minimumScore || 850);
      setStatusMsg(null);
    }
  }, [selectedNodeId, selectedRouteId, hunt.nodes, isPuzzleStage, stageNumber]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setIsSaving(true);
    setStatusMsg(null);

    // Update node with route-specific riddle and puzzle location
    const updatedRouteRiddles = {
      ...(currentNode.routeRiddles || {}),
      [selectedRouteId]: {
        title: riddleTitle.trim(),
        text: riddleText.trim(),
        hint: riddleHint.trim() || undefined,
      },
    };

    const updatedRoutePuzzleLocations = {
      ...(currentNode.routePuzzleLocations || {}),
      ...(isPuzzleStage && puzzleClue.trim()
        ? {
            [selectedRouteId]: {
              clue: puzzleClue.trim(),
              pieceId: puzzlePieceId.trim() || `PIECE_${(stageNumber || 2) - 1}`,
            },
          }
        : {}),
    };

    const updatedNode: HuntNode = {
      ...currentNode,
      routeRiddles: updatedRouteRiddles,
      routePuzzleLocations: updatedRoutePuzzleLocations,
      codeSource,
      minigame:
        currentNode.type === "BOSS" || codeSource === "MINIGAME"
          ? {
              gameId: `${selectedNodeId}_GAME`,
              minimumScore: minigameScore,
              title: "Mainframe Override",
            }
          : undefined,
    };

    // Route-specific secret key
    const routeSecretKey = `${selectedRouteId}_${selectedNodeId}`;

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
          node: updatedNode,
          secretCode: secretCode.trim().toUpperCase(),
          routeSecretKey,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({
          type: "success",
          text: `Saved unique riddle & code for ${selectedNodeId} on ${selectedRouteId}!`,
        });
        if (onRefresh) onRefresh();
      } else {
        soundFx.playAccessDenied();
        setStatusMsg({ type: "error", text: data.error || "Failed to save configuration." });
      }
    } catch {
      soundFx.playAccessDenied();
      setStatusMsg({ type: "error", text: "Network communication failure." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CyberCard className="p-6 space-y-6 border-amber-500/40 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-amber-400">
          <FileText className="w-5 h-5" />
          <div>
            <h2 className="font-black text-base text-slate-100 uppercase tracking-wider">
              TEAM ROUTE RIDDLES & PERSONAL CODE MANAGER
            </h2>
            <p className="text-xs text-slate-400">
              Each team/route has its own unique riddle & personal secret code when visiting any room
            </p>
          </div>
        </div>

        {/* Route Selector & Room Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Route:</span>
            <select
              value={selectedRouteId}
              onChange={(e) => {
                soundFx.playClick();
                setSelectedRouteId(e.target.value);
              }}
              className="rounded border border-cyan-500/60 bg-slate-900 px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
            >
              <option value="P1">Route P1 (Red / Cyan)</option>
              <option value="P2">Route P2 (White / Blue)</option>
              <option value="P3">Route P3 (Black Ops)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Room:</span>
            <select
              value={selectedNodeId}
              onChange={(e) => {
                soundFx.playClick();
                setSelectedNodeId(e.target.value);
              }}
              className="rounded border border-amber-500/50 bg-slate-900 px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            >
              {nodeKeys.map((key) => {
                const node = hunt.nodes[key];
                return (
                  <option key={key} value={key}>
                    {node?.name || key} ({node?.floorId ? `FL ${node.floorId.replace("floor-", "")}` : ""})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Stage Status Pill */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-[#050811] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">{selectedNodeId}</span>
            <span className="text-slate-400">on {selectedRouteId}:</span>
            <span className="text-cyan-300 font-bold">
              {stageNumber ? `Stage #${stageNumber} of ${currentRoute?.nodes?.length}` : "Not in this route"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isStartStage ? (
              <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold">
                START NODE (NO PIECE)
              </span>
            ) : isFinalStage ? (
              <span className="px-2 py-0.5 rounded border border-yellow-500/50 bg-yellow-950/60 text-yellow-300 text-[10px] font-bold">
                FINAL VAULT (ASSEMBLE 6 PIECES)
              </span>
            ) : isPuzzleStage ? (
              <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/60 text-emerald-300 text-[10px] font-bold">
                PUZZLE PIECE #{(stageNumber || 2) - 1} OF 6
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-400 text-[10px] font-bold">
                PURE RIDDLE STAGE (NO PIECES - ALL 6 FOUND)
              </span>
            )}
          </div>
        </div>

        {/* Riddle Transmission */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Riddle Transmission Title ({selectedRouteId})
            </label>
            <input
              type="text"
              value={riddleTitle}
              onChange={(e) => setRiddleTitle(e.target.value)}
              placeholder="e.g. The Executive Sanctum"
              required
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span>Riddle Clue Text for {selectedRouteId} (Do not write room name/number inside!)</span>
              <span className="text-[10px] text-cyan-400 font-semibold">Unique for {selectedRouteId}</span>
            </label>
            <textarea
              rows={3}
              value={riddleText}
              onChange={(e) => setRiddleText(e.target.value)}
              placeholder="e.g. Where leadership charters are drafted and executive guidance convenes. Present your clearance badge to the executive."
              required
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Optional Helpful Hint</span>
            </label>
            <input
              type="text"
              value={riddleHint}
              onChange={(e) => setRiddleHint(e.target.value)}
              placeholder="e.g. Ask the executive for the clearance cipher."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Personal Code & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Code for {selectedRouteId}</span>
            </label>
            <input
              type="text"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
              placeholder="e.g. VICEPRIN"
              required
              className="w-full rounded border border-amber-500/50 bg-slate-900 px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Code Source Category
            </label>
            <select
              value={codeSource}
              onChange={(e) => setCodeSource(e.target.value as "TEACHER" | "HIDDEN" | "MINIGAME")}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="TEACHER">Teacher / Invigilator in Room</option>
              <option value="HIDDEN">Hidden Physical Token in Room</option>
              <option value="MINIGAME">Minigame / Arcade Score</option>
            </select>
          </div>

          {currentNode.type === "BOSS" || codeSource === "MINIGAME" ? (
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1">
                Minigame Score Threshold
              </label>
              <input
                type="number"
                value={minigameScore}
                onChange={(e) => setMinigameScore(Number(e.target.value))}
                min={100}
                max={5000}
                className="w-full rounded border border-amber-500/50 bg-slate-900 px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          ) : isPuzzleStage ? (
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1">
                <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Piece ID (Stage #{stageNumber})</span>
              </label>
              <input
                type="text"
                value={puzzlePieceId}
                onChange={(e) => setPuzzlePieceId(e.target.value.toUpperCase())}
                placeholder="e.g. PIECE_1"
                className="w-full rounded border border-emerald-500/40 bg-slate-900 px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Physical Fragment
              </label>
              <input
                type="text"
                disabled
                value="No pieces after Stage 7"
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Physical Fragment Clue (Only for Stages 2-7) */}
        {isPuzzleStage && (
          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1">
              <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical Fragment #{(stageNumber || 2) - 1} Location Clue for {selectedRouteId}</span>
            </label>
            <input
              type="text"
              value={puzzleClue}
              onChange={(e) => setPuzzleClue(e.target.value)}
              placeholder="e.g. Fragment 1 is cached near the entrance directory plaque."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Saves unique riddle & secret code specifically for {selectedRouteId} when visiting &ldquo;{selectedNodeId}&rdquo;.
          </p>

          <CyberButton
            type="submit"
            loading={isSaving}
            variant="amber"
            size="md"
            className="w-full sm:w-auto font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            SAVE RIDDLE & CODE FOR {selectedRouteId}
          </CyberButton>
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
      </form>
    </CyberCard>
  );
}

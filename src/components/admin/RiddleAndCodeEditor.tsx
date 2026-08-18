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
  Sparkles,
  Eye,
} from "lucide-react";

interface RiddleAndCodeEditorProps {
  hunt: Hunt;
  idToken?: string | null;
  onRefresh?: () => void;
}

export function RiddleAndCodeEditor({ hunt, idToken, onRefresh }: RiddleAndCodeEditorProps) {
  const nodeKeys = Object.keys(hunt.nodes || {});
  const [selectedNodeId, setSelectedNodeId] = useState<string>("202");

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

  // Form State
  const [riddleTitle, setRiddleTitle] = useState(currentNode.riddle?.title || "");
  const [riddleText, setRiddleText] = useState(currentNode.riddle?.text || "");
  const [riddleHint, setRiddleHint] = useState(currentNode.riddle?.hint || "");
  const [secretCode, setSecretCode] = useState(ICAT_2026_SECRETS.codes[selectedNodeId]?.code || "CIPHER");
  const [codeSource, setCodeSource] = useState<"TEACHER" | "HIDDEN" | "MINIGAME">(currentNode.codeSource || "HIDDEN");
  const [puzzleClue, setPuzzleClue] = useState(currentNode.puzzleLocation?.clue || "");
  const [puzzlePieceId, setPuzzlePieceId] = useState(currentNode.puzzleLocation?.pieceId || `PIECE_${selectedNodeId}`);
  const [minigameScore, setMinigameScore] = useState<number>(currentNode.minigame?.minimumScore || 850);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state when selectedNodeId or hunt changes
  useEffect(() => {
    const node = hunt.nodes[selectedNodeId];
    if (node) {
      setRiddleTitle(node.riddle?.title || `Sector ${selectedNodeId} Clue`);
      setRiddleText(node.riddle?.text || "");
      setRiddleHint(node.riddle?.hint || "");
      setSecretCode(ICAT_2026_SECRETS.codes[selectedNodeId]?.code || "CIPHER");
      setCodeSource(node.codeSource || "HIDDEN");
      setPuzzleClue(node.puzzleLocation?.clue || "");
      setPuzzlePieceId(node.puzzleLocation?.pieceId || `PIECE_${selectedNodeId}`);
      setMinigameScore(node.minigame?.minimumScore || 850);
      setStatusMsg(null);
    }
  }, [selectedNodeId, hunt.nodes]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setIsSaving(true);
    setStatusMsg(null);

    const updatedNode: HuntNode = {
      ...currentNode,
      riddle: {
        title: riddleTitle.trim(),
        text: riddleText.trim(),
        hint: riddleHint.trim() || undefined,
      },
      codeSource,
      puzzleLocation: puzzleClue.trim()
        ? {
            clue: puzzleClue.trim(),
            pieceId: puzzlePieceId.trim() || `PIECE_${selectedNodeId}`,
          }
        : undefined,
      minigame:
        currentNode.type === "BOSS" || codeSource === "MINIGAME"
          ? {
              gameId: `${selectedNodeId}_GAME`,
              minimumScore: minigameScore,
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
          node: updatedNode,
          secretCode: secretCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playAccessGranted();
        setStatusMsg({ type: "success", text: `Riddle and unlock code for "${currentNode.name}" saved live to Firestore!` });
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
              ROOM RIDDLE & UNLOCK CODE EDITOR
            </h2>
            <p className="text-xs text-slate-400">
              Customize the riddle clue, hint, and secret clearance code for any campus room
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Target Room:</span>
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

      <form onSubmit={handleSave} className="space-y-4">
        {/* Room Header Info */}
        <div className="p-3.5 rounded-lg border border-slate-800 bg-[#050811] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">Selected Room:</span>
            <span className="text-cyan-300 font-bold">{currentNode.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 font-bold uppercase text-[10px]">
              {currentNode.floorId}
            </span>
            <span
              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                currentNode.type === "BOSS"
                  ? "border-amber-500 bg-amber-950/60 text-amber-300"
                  : currentNode.type === "FINAL"
                  ? "border-yellow-500 bg-yellow-950/60 text-yellow-300"
                  : "border-slate-700 bg-slate-900 text-slate-400"
              }`}
            >
              {currentNode.type} SECTOR
            </span>
          </div>
        </div>

        {/* Riddle Configuration */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Riddle Transmission Title
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
              <span>Riddle Clue Text (The puzzle students read to deduce this room)</span>
              <span className="text-[10px] text-slate-500">Do not include the room number inside text!</span>
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
              <span>Optional Helpful Hint (Revealed if students request a hint)</span>
            </label>
            <input
              type="text"
              value={riddleHint}
              onChange={(e) => setRiddleHint(e.target.value)}
              placeholder="e.g. Floor 2 Vice Principal Cabin. Ask the executive for the clearance cipher."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        {/* Code & Secret Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Secret Clearance Cipher</span>
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
          ) : (
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1">
                <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Physical Piece ID</span>
              </label>
              <input
                type="text"
                value={puzzlePieceId}
                onChange={(e) => setPuzzlePieceId(e.target.value.toUpperCase())}
                placeholder="e.g. PIECE_ALPHA"
                className="w-full rounded border border-emerald-500/40 bg-slate-900 px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          )}
        </div>

        {/* Physical Fragment Clue */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Puzzle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Physical Puzzle Piece Location Clue (Where the physical puzzle piece is hidden in this room)</span>
          </label>
          <input
            type="text"
            value={puzzleClue}
            onChange={(e) => setPuzzleClue(e.target.value)}
            placeholder="e.g. Fragment cached under the animation lightbox in Room 202."
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Changes save directly to Firestore and take effect for all active teams immediately.
          </p>

          <CyberButton
            type="submit"
            loading={isSaving}
            variant="amber"
            size="md"
            className="w-full sm:w-auto font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            SAVE RIDDLE & CODE FOR &ldquo;{selectedNodeId}&rdquo;
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

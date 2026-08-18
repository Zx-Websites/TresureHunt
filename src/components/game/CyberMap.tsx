"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClientHuntNode, HuntFloor, HuntRoute } from "@/lib/game-engine/types";
import { soundFx } from "@/lib/game-engine/sound-effects";
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Zap,
} from "lucide-react";

interface CyberMapProps {
  currentFloor: HuntFloor;
  clientNodes: ClientHuntNode[];
  activeRoute?: HuntRoute | null;
  onSelectNode: (node: ClientHuntNode) => void;
}

export function CyberMap({
  currentFloor,
  clientNodes,
  activeRoute,
  onSelectNode,
}: CyberMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch pinch zoom state
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  // Filter nodes for the current floor
  const floorNodes = clientNodes.filter((n) => n.floorId === currentFloor.id);

  // Reset zoom & pan when floor changes
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [currentFloor.id]);

  const handleZoomIn = () => {
    soundFx.playClick();
    setScale((prev) => Math.min(2.5, prev + 0.25));
  };

  const handleZoomOut = () => {
    soundFx.playClick();
    setScale((prev) => Math.max(0.75, prev - 0.25));
  };

  const handleResetView = () => {
    soundFx.playClick();
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on map surface, not directly on buttons/nodes
    if ((e.target as HTMLElement).closest(".node-interactive")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if ((e.target as HTMLElement).closest(".node-interactive")) return;
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - touchDistance;
      setScale((prev) => Math.min(2.5, Math.max(0.75, prev + diff * 0.005)));
      setTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(null);
  };

  const handleNodeClick = (node: ClientHuntNode) => {
    if (node.state === "LOCKED") {
      soundFx.playAccessDenied();
      return;
    }
    soundFx.playNodeSelect();
    onSelectNode(node);
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] rounded-lg border border-cyan-500/30 bg-[#050811] overflow-hidden select-none shadow-[0_0_25px_rgba(0,240,255,0.1)]">
      {/* Background Cyber Grid & Floor Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/40 bg-[#070B19]/80 backdrop-blur-sm text-cyan-300 font-mono text-xs shadow-md">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold uppercase tracking-wider">{currentFloor.name}</span>
      </div>

      {/* Floating Map Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 bg-[#070B19]/80 backdrop-blur-sm p-1 rounded border border-slate-800">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset View"
          className="p-2 rounded hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1 rounded border border-slate-800 bg-[#070B19]/80 backdrop-blur-sm font-mono text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#00ff9d]" />
          <span>CLEARED</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]" />
          <span>AVAILABLE</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#ffb800]" />
          <span>BOSS</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-600" />
          <span>LOCKED</span>
        </span>
      </div>

      {/* Interactive Map Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full cursor-${isDragging ? "grabbing" : "grab"} relative flex items-center justify-center`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="relative w-[600px] h-[400px] flex-shrink-0"
        >
          {/* SVG Architectural Cyber Blueprint Floor Layer */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400">
            <defs>
              {/* Futuristic Cyber Blueprint Grid */}
              <pattern id="cyberGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0, 240, 255, 0.07)" strokeWidth="0.8" />
              </pattern>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#00ff9d" />
              </linearGradient>
            </defs>

            {/* Background Grid */}
            <rect width="600" height="400" fill="url(#cyberGrid)" />

            {/* Architectural Building Outline */}
            <rect
              x="30"
              y="30"
              width="540"
              height="340"
              rx="12"
              fill="rgba(7, 11, 25, 0.6)"
              stroke="rgba(0, 240, 255, 0.25)"
              strokeWidth="1.5"
            />

            {/* Central Corridor / Zone Divisions */}
            <line x1="30" y1="200" x2="570" y2="200" stroke="rgba(30, 41, 59, 0.8)" strokeWidth="2" strokeDasharray="6 4" />
            <line x1="300" y1="30" x2="300" y2="370" stroke="rgba(30, 41, 59, 0.8)" strokeWidth="2" strokeDasharray="6 4" />

            {/* Radar Crosshairs */}
            <circle cx="300" cy="200" r="140" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="1" />
            <circle cx="300" cy="200" r="70" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" />

            {/* Animated glowing route lines between on-floor nodes */}
            {(() => {
              const lines: React.ReactNode[] = [];
              const renderedPairs = new Set<string>();

              // 1. Connect sequential nodes from activeRoute
              if (activeRoute && Array.isArray(activeRoute.nodes)) {
                for (let i = 0; i < activeRoute.nodes.length - 1; i++) {
                  const fromId = activeRoute.nodes[i];
                  const toId = activeRoute.nodes[i + 1];
                  const fromNode = floorNodes.find((n) => n.id === fromId);
                  const toNode = floorNodes.find((n) => n.id === toId);

                  if (fromNode && toNode) {
                    const pairKey = `${fromId}->${toId}`;
                    renderedPairs.add(pairKey);
                    const isIlluminated = fromNode.state === "COMPLETED";
                    const x1 = (fromNode.position.x / 100) * 600;
                    const y1 = (fromNode.position.y / 100) * 400;
                    const x2 = (toNode.position.x / 100) * 600;
                    const y2 = (toNode.position.y / 100) * 400;

                    lines.push(
                      <line
                        key={`route-line-${pairKey}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isIlluminated ? "#00f0ff" : "rgba(51, 65, 85, 0.6)"}
                        strokeWidth={isIlluminated ? "2.5" : "1.5"}
                        strokeDasharray={isIlluminated ? "8 4" : "4 4"}
                        className={isIlluminated ? "animate-pulse" : ""}
                      />
                    );
                  }
                }
              }

              // 2. Connect explicit nextNodes
              floorNodes.forEach((node) => {
                (node.nextNodes || []).forEach((targetId) => {
                  const targetNode = floorNodes.find((n) => n.id === targetId);
                  const pairKey = `${node.id}->${targetId}`;
                  if (targetNode && !renderedPairs.has(pairKey)) {
                    renderedPairs.add(pairKey);
                    const isIlluminated = node.state === "COMPLETED";
                    const x1 = (node.position.x / 100) * 600;
                    const y1 = (node.position.y / 100) * 400;
                    const x2 = (targetNode.position.x / 100) * 600;
                    const y2 = (targetNode.position.y / 100) * 400;

                    lines.push(
                      <line
                        key={`next-line-${pairKey}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isIlluminated ? "#00f0ff" : "rgba(51, 65, 85, 0.4)"}
                        strokeWidth={isIlluminated ? "2" : "1.2"}
                        strokeDasharray={isIlluminated ? "8 4" : "4 4"}
                      />
                    );
                  }
                });
              });

              return lines;
            })()}
          </svg>

          {/* Interactive Node Markers Overlay */}
          {floorNodes.map((node) => {
            const isCompleted = node.state === "COMPLETED";
            const isAvailable = node.state === "AVAILABLE";
            const isLocked = node.state === "LOCKED";
            const isBoss = node.type === "BOSS";
            const isFinal = node.type === "FINAL";

            return (
              <div
                key={node.id}
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute z-20 node-interactive"
              >
                <button
                  onClick={() => handleNodeClick(node)}
                  disabled={isLocked}
                  className={`group relative flex flex-col items-center focus:outline-none ${
                    isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  }`}
                >
                  {/* Outer Glowing Rings for Available/Boss nodes */}
                  {isAvailable && (
                    <div
                      className={`absolute -inset-3 rounded-full animate-ping opacity-60 pointer-events-none ${
                        isBoss ? "bg-amber-400" : isFinal ? "bg-yellow-300" : "bg-cyan-400"
                      }`}
                    />
                  )}

                  {/* Core Node Marker Hexagon / Circle */}
                  <div
                    className={`relative flex items-center justify-center h-12 w-12 rounded-xl border-2 font-mono font-bold transition-all duration-300 ${
                      isCompleted
                        ? "border-emerald-400 bg-emerald-950/80 text-emerald-300 shadow-[0_0_18px_rgba(0,255,157,0.5)]"
                        : isAvailable
                        ? isBoss
                          ? "border-amber-400 bg-amber-950/90 text-amber-200 shadow-[0_0_22px_rgba(255,184,0,0.6)] animate-pulse"
                          : isFinal
                          ? "border-yellow-400 bg-yellow-950/90 text-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.7)] animate-pulse"
                          : "border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.6)] animate-pulse"
                        : "border-slate-800 bg-[#070B19] text-slate-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : isAvailable ? (
                      isBoss ? (
                        <AlertTriangle className="w-6 h-6 text-amber-400 animate-bounce" />
                      ) : isFinal ? (
                        <Zap className="w-6 h-6 text-yellow-300" />
                      ) : (
                        <Unlock className="w-5 h-5 text-cyan-300" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}

                    {/* Node Mystery Badge */}
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300 font-bold">
                      {isCompleted ? node.id : isAvailable ? (isBoss ? "BOSS" : isFinal ? "VAULT" : "?") : "🔒"}
                    </span>
                  </div>

                  {/* Objective Label (Never spoils room name for uncompleted nodes) */}
                  <div className="mt-1.5 px-2 py-0.5 rounded border border-slate-800/80 bg-[#070B19]/90 backdrop-blur-sm max-w-[140px] text-center shadow-lg">
                    <p
                      className={`text-xs font-mono font-bold truncate ${
                        isCompleted
                          ? "text-emerald-300"
                          : isAvailable
                          ? isBoss
                            ? "text-amber-300"
                            : "text-cyan-300"
                          : "text-slate-500"
                      }`}
                    >
                      {isCompleted
                        ? `${node.name}`
                        : isAvailable
                        ? isBoss
                          ? "BOSS ENCOUNTER"
                          : isFinal
                          ? "FINAL VAULT"
                          : "DECODE RIDDLE"
                        : "CLASSIFIED"}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

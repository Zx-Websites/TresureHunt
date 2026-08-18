"use client";

import React from "react";
import { HuntFloor, ClientHuntNode } from "@/lib/game-engine/types";
import { soundFx } from "@/lib/game-engine/sound-effects";
import { Layers, AlertTriangle, CheckCircle2, Radio } from "lucide-react";

interface FloorSelectorProps {
  floors: HuntFloor[];
  currentFloorId: string;
  onSelectFloor: (floorId: string) => void;
  clientNodes: ClientHuntNode[];
}

export function FloorSelector({
  floors,
  currentFloorId,
  onSelectFloor,
  clientNodes,
}: FloorSelectorProps) {
  const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber);

  const handleFloorClick = (floorId: string) => {
    soundFx.playClick();
    onSelectFloor(floorId);
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider">CAMPUS DECK SELECTOR</span>
        </div>
        <span className="font-mono text-[11px] text-cyan-400">
          {floors.find((f) => f.id === currentFloorId)?.name || "Floor Active"}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-cyan-900">
        {sortedFloors.map((floor) => {
          const isActive = floor.id === currentFloorId;
          const floorNodes = clientNodes.filter((n) => n.floorId === floor.id);

          const hasAvailable = floorNodes.some((n) => n.state === "AVAILABLE");
          const hasBoss = floorNodes.some((n) => n.type === "BOSS");
          const isAllCompleted =
            floorNodes.length > 0 && floorNodes.every((n) => n.state === "COMPLETED");

          return (
            <button
              key={floor.id}
              onClick={() => handleFloorClick(floor.id)}
              className={`relative flex-1 min-w-[70px] sm:min-w-[90px] py-2 px-2.5 rounded border font-mono transition-all duration-200 text-center ${
                isActive
                  ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-[1.02]"
                  : "border-slate-800 bg-[#070B19]/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {/* Active floor indicator bar */}
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              )}

              <div className="flex items-center justify-center gap-1">
                <span className="text-xs sm:text-sm font-bold tracking-wider">
                  {floor.shortName || `FL ${floor.floorNumber}`}
                </span>

                {/* Status Badges */}
                {hasAvailable && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                  </span>
                )}
                {hasBoss && (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
                {isAllCompleted && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                Level {floor.floorNumber}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

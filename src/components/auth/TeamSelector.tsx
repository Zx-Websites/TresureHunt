"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { CyberCard } from "../ui/CyberCard";
import { CyberButton } from "../ui/CyberButton";
import { ICAT_2026_HUNT_DATA } from "@/lib/game-engine/icat-2026-seed-data";
import { Shield, CheckCircle2, ChevronRight } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

export function TeamSelector() {
  const { profile, selectTeam } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const teams = Object.values(ICAT_2026_HUNT_DATA.teams);

  const handleSelectCard = (teamId: string) => {
    soundFx.playClick();
    setSelectedTeamId(teamId);
    setIsConfirming(true);
  };

  const handleConfirmTeam = async () => {
    if (!selectedTeamId) return;
    setIsSaving(true);
    try {
      await selectTeam(selectedTeamId, "icat-2026");
    } finally {
      setIsSaving(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 font-mono text-xs tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5" />
          <span>SQUAD REGISTRATION PHASE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-100 tracking-wide">
          SELECT YOUR SQUAD
        </h1>
        <p className="text-sm font-mono text-slate-400 max-w-md mx-auto">
          Welcome, <span className="text-cyan-300 font-bold">{profile?.name || "Agent"}</span>.
          Assign your identity to a squad to access your shared tactical navigation matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => {
          const isSelected = selectedTeamId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelectCard(t.id)}
              className="text-left group focus:outline-none h-full flex flex-col"
            >
              <CyberCard
                className={`p-5 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between min-h-[190px] w-full ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-950/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-[1.02]"
                    : "hover:border-slate-600 hover:bg-slate-900/60"
                }`}
              >
                {/* Card Top: Color Indicator & Route Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="h-4 w-4 rounded-full shadow-md flex-shrink-0"
                    style={{ backgroundColor: t.hex }}
                  />
                  <span className="font-mono text-[11px] font-bold text-slate-400 border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 rounded">
                    ROUTE {t.routeId}
                  </span>
                </div>

                {/* Card Middle: Team Name with fixed height for equal layout */}
                <div className="my-auto py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono text-slate-300 font-bold flex-shrink-0">{t.badge}</span>
                    <h3 className="font-mono font-bold text-base sm:text-lg text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                      {t.name}
                    </h3>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 pl-7">Team Code: {t.id}</p>
                </div>

                {/* Card Bottom: Action Footer */}
                <div className="mt-auto pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:text-cyan-300">
                  <span className="font-semibold tracking-wider">SELECT SQUAD</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </CyberCard>
            </button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {isConfirming && selectedTeamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <CyberCard className="w-full max-w-md p-6 space-y-5 border-cyan-400/80 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="font-mono font-bold text-base text-slate-100">CONFIRM SQUAD ASSIGNMENT</h3>
                <p className="text-xs font-mono text-slate-400">Locking identity to team state</p>
              </div>
            </div>

            <div className="rounded border border-slate-800 bg-slate-950/60 p-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Squad:</span>
                <span className="text-cyan-300 font-bold">{ICAT_2026_HUNT_DATA.teams[selectedTeamId]?.name} ({selectedTeamId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Route:</span>
                <span className="text-emerald-400 font-bold">{ICAT_2026_HUNT_DATA.teams[selectedTeamId]?.routeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Initial Location:</span>
                <span className="text-amber-400 font-bold">Room 202 (Floor 2)</span>
              </div>
              <p className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                Notice: All members of your squad share the same live progression. You will collaborate on decoding nodes and collecting puzzle pieces.
              </p>
            </div>

            <div className="flex gap-3">
              <CyberButton
                onClick={handleConfirmTeam}
                loading={isSaving}
                variant="cyan"
                size="md"
                className="flex-1"
              >
                CONFIRM & ENTER HUNT
              </CyberButton>
              <CyberButton
                onClick={() => setIsConfirming(false)}
                variant="ghost"
                size="md"
                disabled={isSaving}
              >
                CANCEL
              </CyberButton>
            </div>
          </CyberCard>
        </div>
      )}
    </div>
  );
}

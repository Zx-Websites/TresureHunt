"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

export function SoundToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundFx.getMuted());
  }, []);

  const toggleSound = () => {
    const next = !muted;
    soundFx.setMuted(next);
    setMuted(next);
    if (!next) {
      soundFx.playClick();
    }
  };

  return (
    <button
      onClick={toggleSound}
      title={muted ? "Unmute Audio" : "Mute Audio"}
      className={`relative inline-flex items-center justify-center p-2 rounded-md border border-slate-800 bg-[#070B19]/80 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors ${className}`}
    >
      {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
    </button>
  );
}

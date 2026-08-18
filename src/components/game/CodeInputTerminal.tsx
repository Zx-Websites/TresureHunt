"use client";

import React, { useState } from "react";
import { CyberButton } from "../ui/CyberButton";
import { KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface CodeInputTerminalProps {
  nodeId: string;
  isSubmitting: boolean;
  onSubmitCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

export function CodeInputTerminal({
  nodeId,
  isSubmitting,
  onSubmitCode,
}: CodeInputTerminalProps) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundFx.playClick();
    setCode(e.target.value.toUpperCase());
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const res = await onSubmitCode(code);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setCode("");
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
          <span>ENTER CLEARANCE CIPHER</span>
        </label>
        <span className="text-[10px] text-slate-400">SECTOR {nodeId}</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="e.g. ALPHA202"
            value={code}
            onChange={handleInputChange}
            disabled={isSubmitting}
            maxLength={20}
            className="w-full rounded border border-cyan-500/40 bg-[#050811] px-3.5 py-2.5 text-center font-mono text-base font-black tracking-widest text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:bg-[#070B19] focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            autoFocus
          />
        </div>
        <CyberButton
          type="submit"
          variant="cyan"
          size="md"
          loading={isSubmitting}
          disabled={!code.trim() || isSubmitting}
        >
          SUBMIT
        </CyberButton>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded text-xs font-mono border animate-in fade-in ${
            feedback.type === "success"
              ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300"
              : "border-rose-500/50 bg-rose-950/60 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </form>
  );
}

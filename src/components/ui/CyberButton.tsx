import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { soundFx } from "@/lib/game-engine/sound-effects";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "magenta" | "green" | "amber" | "red" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
}

export function CyberButton({
  children,
  className,
  variant = "cyan",
  size = "md",
  loading = false,
  glow = true,
  disabled,
  onClick,
  ...props
}: CyberButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      soundFx.playClick();
      if (onClick) onClick(e);
    }
  };

  const variantStyles = {
    cyan: "bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-100",
    magenta: "bg-pink-500/20 text-pink-300 border-pink-400 hover:bg-pink-500/30 hover:text-pink-100",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-100",
    amber: "bg-amber-500/20 text-amber-300 border-amber-400 hover:bg-amber-500/30 hover:text-amber-100",
    red: "bg-rose-500/20 text-rose-300 border-rose-400 hover:bg-rose-500/30 hover:text-rose-100",
    ghost: "bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800/50 hover:text-slate-200",
  };

  const glowStyles = {
    cyan: "shadow-[0_0_15px_rgba(0,240,255,0.35)]",
    magenta: "shadow-[0_0_15px_rgba(255,0,127,0.35)]",
    green: "shadow-[0_0_15px_rgba(0,255,157,0.35)]",
    amber: "shadow-[0_0_15px_rgba(255,184,0,0.35)]",
    red: "shadow-[0_0_15px_rgba(255,42,85,0.35)]",
    ghost: "",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs font-mono tracking-wider",
    md: "px-4 py-2 text-sm font-mono tracking-wider",
    lg: "px-6 py-3 text-base font-mono tracking-widest uppercase",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center rounded border font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variantStyles[variant],
        sizeStyles[size],
        glow && !disabled && glowStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>PROCESSING...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

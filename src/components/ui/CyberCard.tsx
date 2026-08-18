import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  variant?: "cyan" | "magenta" | "green" | "amber" | "default";
  glow?: boolean;
  cornerAccents?: boolean;
}

export function CyberCard({
  children,
  className,
  variant = "default",
  glow = false,
  cornerAccents = true,
}: CyberCardProps) {
  const variantStyles = {
    default: "border-slate-800 bg-[#070B19]/90 text-slate-100",
    cyan: "border-cyan-500/30 bg-[#070B19]/90 text-cyan-100 hover:border-cyan-400/60",
    magenta: "border-pink-500/30 bg-[#070B19]/90 text-pink-100 hover:border-pink-400/60",
    green: "border-emerald-500/30 bg-[#070B19]/90 text-emerald-100 hover:border-emerald-400/60",
    amber: "border-amber-500/30 bg-[#070B19]/90 text-amber-100 hover:border-amber-400/60",
  };

  const glowStyles = {
    default: "",
    cyan: "shadow-[0_0_20px_rgba(0,240,255,0.15)]",
    magenta: "shadow-[0_0_20px_rgba(255,0,127,0.15)]",
    green: "shadow-[0_0_20px_rgba(0,255,157,0.15)]",
    amber: "shadow-[0_0_20px_rgba(255,184,0,0.15)]",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border backdrop-blur-md transition-all duration-300",
        variantStyles[variant],
        glow && glowStyles[variant],
        className
      )}
    >
      {cornerAccents && (
        <>
          <div className="absolute -top-[1px] -left-[1px] h-2 w-2 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute -top-[1px] -right-[1px] h-2 w-2 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute -bottom-[1px] -left-[1px] h-2 w-2 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute -bottom-[1px] -right-[1px] h-2 w-2 border-b-2 border-r-2 border-cyan-400" />
        </>
      )}
      {children}
    </div>
  );
}

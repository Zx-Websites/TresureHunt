import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#04070F",
          dark: "#070B19",
          surface: "#0D1527",
          border: "#1E293B",
          card: "rgba(13, 21, 39, 0.8)",
          cyan: "#00F0FF",
          "cyan-dim": "#00A3AD",
          magenta: "#FF007F",
          "magenta-dim": "#B30059",
          green: "#00FF9D",
          "green-dim": "#00B36E",
          amber: "#FFB800",
          red: "#FF2A55",
          purple: "#9D4EDD",
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.2)",
        "neon-magenta": "0 0 15px rgba(255, 0, 127, 0.4), 0 0 30px rgba(255, 0, 127, 0.2)",
        "neon-green": "0 0 15px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)",
        "neon-amber": "0 0 15px rgba(255, 184, 0, 0.4), 0 0 30px rgba(255, 184, 0, 0.2)",
        "cyber-card": "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "pulse-cyan": "pulseCyan 2s infinite ease-in-out",
        "pulse-magenta": "pulseMagenta 2s infinite ease-in-out",
        "scanline": "scanline 8s linear infinite",
        "glitch": "glitch 1s infinite alternate",
      },
      keyframes: {
        pulseCyan: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 240, 255, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(0, 240, 255, 0.8), 0 0 45px rgba(0, 240, 255, 0.4)" },
        },
        pulseMagenta: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255, 0, 127, 0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(255, 0, 127, 0.8), 0 0 45px rgba(255, 0, 127, 0.4)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

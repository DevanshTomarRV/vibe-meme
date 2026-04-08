"use client";

export default function LoadingState() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="glass-strong rounded-2xl p-12 text-center">
        {/* Animated orbital rings */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin" style={{ animationDuration: "3s" }} />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
          <div className="absolute inset-4 rounded-full border-2 border-pink-500/30 animate-spin" style={{ animationDuration: "4s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse-glow" />
          </div>
        </div>

        <p className="text-xl font-mono neon-text-cyan animate-pulse-glow">
          Analyzing Sprint Vibe...
        </p>
        <p className="text-sm text-white/40 mt-3 font-mono">
          The AI Bouncer is judging your retro
        </p>

        {/* Shimmer bar */}
        <div className="mt-8 h-1 w-48 mx-auto rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full w-full rounded-full animate-shimmer"
            style={{
              backgroundSize: "200% 100%",
              backgroundImage: "linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

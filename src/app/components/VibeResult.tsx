"use client";

interface VibeResultProps {
  richnessScore: number;
  aiComment: string;
  rating: number;
}

const VIDEO_MAP: Record<number, { url: string; title: string }> = {
  1: { url: "https://www.youtube.com/embed/GPLJVitGsso?autoplay=1&mute=1", title: "Pooja, What is this behavior?" },
  2: { url: "https://www.youtube.com/embed/-3_IuPMya6k?autoplay=1&mute=1", title: "I'm Tired Boss" },
  3: { url: "https://www.youtube.com/embed/0oBx7Jg4m-o?autoplay=1&mute=1", title: "This Is Fine" },
  4: { url: "https://www.youtube.com/embed/jxdTwLvECAA?autoplay=1&mute=1&start=80", title: "Pedro Pascal Laughing Then Crying" },
  5: { url: "https://www.youtube.com/embed/ywgeloPNmxk?autoplay=1&mute=1", title: "Gopi Bahu Laptop Washing" },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]";
  if (score >= 60) return "drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]";
  if (score >= 40) return "drop-shadow-[0_0_15px_rgba(251,146,60,0.6)]";
  return "drop-shadow-[0_0_15px_rgba(248,113,113,0.6)]";
}

export default function VibeResult({ richnessScore, aiComment, rating }: VibeResultProps) {
  const video = VIDEO_MAP[rating];

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 space-y-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Score Card */}
      <div className="glass-strong rounded-2xl p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
          Richness Verdict
        </p>
        <div className={`text-7xl font-bold font-mono ${getScoreColor(richnessScore)} ${getScoreGlow(richnessScore)} transition-all`}>
          {richnessScore}
        </div>
        <p className="text-xs text-white/40 mt-1 font-mono">/ 100</p>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm uppercase tracking-widest text-purple-300/80 mb-3 font-mono">
            The Bouncer Says
          </p>
          <p className="text-lg text-white/90 italic leading-relaxed">
            &ldquo;{aiComment}&rdquo;
          </p>
        </div>
      </div>

      {/* Video Card */}
      <div className="glass rounded-2xl p-6">
        <p className="text-sm uppercase tracking-widest text-cyan-300/80 mb-4 font-mono text-center">
          Your Sprint Anthem
        </p>
        <p className="text-center text-white/60 text-sm mb-4">{video.title}</p>
        <div className="relative rounded-xl overflow-hidden neon-border-cyan border-2">
          <iframe
            src={video.url}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
          />
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-white/40 hover:text-white/80 transition-colors font-mono cursor-pointer underline underline-offset-4"
        >
          ↺ Start Over
        </button>
      </div>
    </div>
  );
}

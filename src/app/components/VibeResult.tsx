"use client";

interface VibeResultProps {
  richnessScore: number;
  aiComment: string;
  memeUrl: string;
  onReset: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "drop-shadow-[0_0_20px_rgba(74,222,128,0.7)]";
  if (score >= 60) return "drop-shadow-[0_0_20px_rgba(250,204,21,0.7)]";
  if (score >= 40) return "drop-shadow-[0_0_20px_rgba(251,146,60,0.7)]";
  return "drop-shadow-[0_0_20px_rgba(248,113,113,0.7)]";
}

function getScoreNeonBorder(score: number): string {
  if (score >= 80) return "shadow-[0_0_30px_rgba(74,222,128,0.25),inset_0_0_30px_rgba(74,222,128,0.05)]";
  if (score >= 60) return "shadow-[0_0_30px_rgba(250,204,21,0.25),inset_0_0_30px_rgba(250,204,21,0.05)]";
  if (score >= 40) return "shadow-[0_0_30px_rgba(251,146,60,0.25),inset_0_0_30px_rgba(251,146,60,0.05)]";
  return "shadow-[0_0_30px_rgba(248,113,113,0.25),inset_0_0_30px_rgba(248,113,113,0.05)]";
}

function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}?autoplay=1&mute=1`;
    }
    if (parsed.hostname.includes("youtube.com") && parsed.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}?autoplay=1&mute=1`;
    }
    if (parsed.pathname.includes("/embed/")) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}autoplay=1&mute=1`;
    }
  } catch {
    // fall through
  }
  return url;
}

export default function VibeResult({ richnessScore, aiComment, memeUrl, onReset }: VibeResultProps) {
  const embedSrc = toEmbedUrl(memeUrl);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 space-y-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Score Card */}
      <div className={`glass-strong rounded-2xl p-8 text-center ${getScoreNeonBorder(richnessScore)}`}>
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
        <div className="relative rounded-xl overflow-hidden neon-border-cyan border-2">
          <iframe
            src={embedSrc}
            title="Your Meme Vibe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
          />
        </div>
      </div>

      {/* Submit Another */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="px-8 py-4 rounded-xl font-mono font-bold text-base uppercase tracking-widest
            bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400
            text-white shadow-[0_0_30px_rgba(120,80,255,0.3)] hover:shadow-[0_0_40px_rgba(120,80,255,0.5)]
            transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          Submit Another Vibe
        </button>
      </div>
    </div>
  );
}

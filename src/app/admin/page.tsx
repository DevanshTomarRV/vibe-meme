"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

interface Submission {
  id: string;
  user_name: string;
  rating: number;
  explanation: string;
  richness_score: number;
  ai_comment: string;
  meme_url: string;
  created_at: string;
}

const RATING_COLORS: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-blue-400",
  5: "text-purple-400",
};

const RATING_EMOJI: Record<number, string> = {
  1: "💀",
  2: "😮‍💨",
  3: "😐",
  4: "😎",
  5: "🚀",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getScoreGlow(score: number): string {
  if (score >= 80) return "drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]";
  if (score >= 60) return "drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]";
  if (score >= 40) return "drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]";
  return "drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]";
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getSupabase()
      .from("sprint_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setSubmissions(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-16">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-3">
          <span className="neon-text-purple">Admin</span>{" "}
          <span className="neon-text-cyan">Dashboard</span>
        </h1>
        <p className="text-sm text-white/50 font-mono tracking-widest uppercase">
          Sprint Retro Command Center
        </p>
      </header>

      {/* Toolbar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <p className="text-white/40 font-mono text-sm">
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={fetchSubmissions}
          className="px-4 py-2 rounded-lg glass text-white/60 hover:text-white/90 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer hover:border-cyan-400/30"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="w-full max-w-4xl glass-strong rounded-2xl p-12 text-center">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin mb-4" />
          <p className="text-white/40 font-mono text-sm">Loading submissions...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="w-full max-w-4xl glass-strong rounded-2xl p-8 text-center border border-red-500/30">
          <p className="text-red-400 font-mono mb-2">Failed to load submissions</p>
          <p className="text-white/40 font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && submissions.length === 0 && (
        <div className="w-full max-w-4xl glass-strong rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🫥</div>
          <p className="text-white/50 font-mono">No submissions yet. Waiting for the crew...</p>
        </div>
      )}

      {/* Submissions List */}
      {!loading && !error && submissions.length > 0 && (
        <div className="w-full max-w-4xl space-y-3">
          {submissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div key={sub.id} className="animate-fadeIn">
                {/* Row */}
                <button
                  onClick={() => toggleExpand(sub.id)}
                  className={`
                    w-full glass rounded-xl p-5 flex items-center justify-between
                    transition-all duration-300 cursor-pointer text-left
                    hover:border-cyan-400/30 hover:bg-white/[0.07]
                    ${isExpanded ? "border-cyan-400/40 bg-white/[0.07] rounded-b-none" : ""}
                  `}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl shrink-0">{RATING_EMOJI[sub.rating]}</span>
                    <div className="min-w-0">
                      <p className="text-white/90 font-mono font-bold truncate">
                        {sub.user_name}
                      </p>
                      <p className="text-white/30 font-mono text-xs mt-0.5">
                        Rating: <span className={RATING_COLORS[sub.rating]}>{sub.rating}/5</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className={`text-2xl font-bold font-mono ${getScoreColor(sub.richness_score)} ${getScoreGlow(sub.richness_score)}`}>
                        {sub.richness_score}
                      </span>
                      <p className="text-white/20 font-mono text-[10px]">richness</p>
                    </div>
                    <span className={`text-white/30 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="glass-strong rounded-b-xl border-t-0 p-6 space-y-6 animate-fadeIn">
                    {/* Explanation */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cyan-300/60 font-mono mb-2">
                        Their Explanation
                      </p>
                      <p className="text-white/80 text-sm leading-relaxed font-mono bg-white/5 rounded-lg p-4">
                        {sub.explanation}
                      </p>
                    </div>

                    {/* AI Comment */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-purple-300/60 font-mono mb-2">
                        The Bouncer Says
                      </p>
                      <p className="text-white/80 text-sm italic font-mono bg-white/5 rounded-lg p-4">
                        &ldquo;{sub.ai_comment}&rdquo;
                      </p>
                    </div>

                    {/* Video */}
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cyan-300/60 font-mono mb-3">
                        Sprint Anthem
                      </p>
                      <div className="relative rounded-xl overflow-hidden neon-border-cyan border-2">
                        <iframe
                          src={sub.meme_url}
                          title={`Meme for ${sub.user_name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full aspect-video"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-white/20 font-mono">
        <p>Meme Vibe Admin v0.2 — Screen-Share Party Mode</p>
      </footer>
    </main>
  );
}

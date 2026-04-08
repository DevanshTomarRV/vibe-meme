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

interface MemeForm {
  id: string;
  title: string;
  base_rating: number;
  video_url: string;
  cultural_tags: string;
  semantic_context: string;
}

const EMPTY_MEME_FORM: MemeForm = {
  id: "",
  title: "",
  base_rating: 3,
  video_url: "",
  cultural_tags: "",
  semantic_context: "",
};

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

  const [memeForm, setMemeForm] = useState<MemeForm>(EMPTY_MEME_FORM);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsMessage, setCmsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const updateMemeField = <K extends keyof MemeForm>(field: K, value: MemeForm[K]) => {
    setMemeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMeme = useCallback(async () => {
    setCmsLoading(true);
    setCmsMessage(null);

    try {
      const tags = memeForm.cultural_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/add-meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: memeForm.id.trim(),
          title: memeForm.title.trim(),
          base_rating: memeForm.base_rating,
          video_url: memeForm.video_url.trim(),
          cultural_tags: tags,
          semantic_context: memeForm.semantic_context.trim(),
        }),
      });

      const data: { success?: boolean; meme?: { title: string }; error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setCmsMessage({ type: "success", text: `"${data.meme?.title}" embedded and saved!` });
      setMemeForm(EMPTY_MEME_FORM);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add meme";
      setCmsMessage({ type: "error", text: message });
    } finally {
      setCmsLoading(false);
    }
  }, [memeForm]);

  const isCmsValid =
    memeForm.id.trim().length > 0 &&
    memeForm.title.trim().length > 0 &&
    memeForm.video_url.trim().length > 0 &&
    memeForm.semantic_context.trim().length >= 10;

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

      {/* ═══════════════════ Meme CMS ═══════════════════ */}
      <section className="w-full max-w-4xl mb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="neon-text-purple">Add Meme</span>{" "}
            <span className="neon-text-cyan">to Brain</span>
            <span className="text-white/30 text-sm ml-2 font-mono">(CMS)</span>
          </h2>
          <p className="text-xs text-white/30 mt-1 font-mono">
            Teach the AI a new emotional state
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-5">
          {/* Row 1: ID + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
                Unique ID
              </label>
              <input
                type="text"
                value={memeForm.id}
                onChange={(e) => updateMemeField("id", e.target.value)}
                placeholder="e.g. office_parkour_01"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
                Title
              </label>
              <input
                type="text"
                value={memeForm.title}
                onChange={(e) => updateMemeField("title", e.target.value)}
                placeholder="e.g. Michael Scott Parkour"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Row 2: Base Rating + Video URL */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
                Base Rating
              </label>
              <select
                value={memeForm.base_rating}
                onChange={(e) => updateMemeField("base_rating", Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="bg-gray-900 text-white">
                    {n} — {["Dumpster Fire", "Struggling", "Meh", "Good", "Legendary"][n - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
                Video URL
              </label>
              <input
                type="url"
                value={memeForm.video_url}
                onChange={(e) => updateMemeField("video_url", e.target.value)}
                placeholder="https://youtube.com/embed/... or https://giphy.com/embed/..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm"
              />
            </div>
          </div>

          {/* Row 3: Cultural Tags */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-cyan-300/80 mb-2 font-mono">
              Cultural Tags
              <span className="text-white/30 ml-2 normal-case">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={memeForm.cultural_tags}
              onChange={(e) => updateMemeField("cultural_tags", e.target.value)}
              placeholder="e.g. India, Bollywood, Tech Humor"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm"
            />
          </div>

          {/* Row 4: Semantic Context */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono">
              <span className="neon-text-purple">The Semantic Context</span>
              <span className="text-white/40 ml-1">— This is what the AI reads!</span>
            </label>
            <textarea
              value={memeForm.semantic_context}
              onChange={(e) => updateMemeField("semantic_context", e.target.value)}
              placeholder="Describe the emotional state this meme captures. Be vivid — the AI uses this to match user vibes..."
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleAddMeme}
            disabled={!isCmsValid || cmsLoading}
            className={`
              w-full py-4 rounded-xl font-mono font-bold text-base uppercase tracking-widest
              transition-all duration-300 cursor-pointer
              ${
                isCmsValid && !cmsLoading
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_30px_rgba(120,80,255,0.3)] hover:shadow-[0_0_40px_rgba(120,80,255,0.5)] active:scale-[0.98]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }
            `}
          >
            {cmsLoading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Embedding into Brain...
              </span>
            ) : (
              "Embed Meme into Brain"
            )}
          </button>

          {/* CMS Feedback */}
          {cmsMessage && (
            <div
              className={`rounded-xl p-4 text-center font-mono text-sm animate-fadeIn ${
                cmsMessage.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              {cmsMessage.type === "success" ? "✓ " : "✗ "}
              {cmsMessage.text}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ Submissions ═══════════════════ */}
      <section className="w-full max-w-4xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="glass-strong rounded-2xl p-12 text-center">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin mb-4" />
            <p className="text-white/40 font-mono text-sm">Loading submissions...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-strong rounded-2xl p-8 text-center border border-red-500/30">
            <p className="text-red-400 font-mono mb-2">Failed to load submissions</p>
            <p className="text-white/40 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && submissions.length === 0 && (
          <div className="glass-strong rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🫥</div>
            <p className="text-white/50 font-mono">No submissions yet. Waiting for the crew...</p>
          </div>
        )}

        {/* Submissions List */}
        {!loading && !error && submissions.length > 0 && (
          <div className="space-y-3">
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

                      {/* Video / GIF */}
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
                            className={`w-full ${sub.meme_url?.includes("giphy.com") ? "h-[350px]" : "aspect-video"}`}
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
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-white/20 font-mono">
        <p>Meme Vibe Admin v0.3 — CMS + Screen-Share Party Mode</p>
      </footer>
    </main>
  );
}

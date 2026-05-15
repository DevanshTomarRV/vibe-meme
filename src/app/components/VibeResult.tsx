"use client";

import { useState } from "react";
import { normalizeYouTubePlaybackUrl } from "@/lib/youtubeEmbed";

interface VibeResultProps {
  submissionId: string;
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

type FeedbackPhase = "open" | "submitting" | "done" | "skipped";

export default function VibeResult({
  submissionId,
  richnessScore,
  aiComment,
  memeUrl,
  onReset,
}: VibeResultProps) {
  const embedSrc = normalizeYouTubePlaybackUrl(memeUrl);
  const [relatable, setRelatable] = useState<boolean | null>(null);
  const [howText, setHowText] = useState("");
  const [phase, setPhase] = useState<FeedbackPhase>("open");
  const [fbError, setFbError] = useState<string | null>(null);

  const submitFeedback = async () => {
    if (relatable === null) return;
    if (relatable && howText.trim().length < 8) {
      setFbError("Tell us how it landed — at least a few words.");
      return;
    }
    setFbError(null);
    setPhase("submitting");
    try {
      const res = await fetch("/api/meme-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          relatable,
          how: relatable ? howText.trim() : undefined,
        }),
      });
      const data: { error?: string } = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save feedback");
      }
      setPhase("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setFbError(msg);
      setPhase("open");
    }
  };

  const skipFeedback = () => setPhase("skipped");

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

      {/* Meme relatability feedback */}
      {phase === "open" && (
        <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-5 border border-white/10">
          <p className="text-sm uppercase tracking-widest text-cyan-300/80 font-mono text-center">
            Quick pulse check
          </p>
          <p className="text-center text-white/85 font-mono text-sm leading-relaxed">
            Was the meme relatable?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                setRelatable(true);
                setFbError(null);
              }}
              className={`px-6 py-3 rounded-xl font-mono text-sm uppercase tracking-widest transition-all cursor-pointer border-2
                ${
                  relatable === true
                    ? "border-green-400/70 bg-green-500/15 text-green-300 shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                    : "border-white/15 bg-white/5 text-white/70 hover:border-green-400/40 hover:text-white/90"
                }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setRelatable(false);
                setFbError(null);
                setHowText("");
              }}
              className={`px-6 py-3 rounded-xl font-mono text-sm uppercase tracking-widest transition-all cursor-pointer border-2
                ${
                  relatable === false
                    ? "border-orange-400/70 bg-orange-500/15 text-orange-200 shadow-[0_0_20px_rgba(251,146,60,0.2)]"
                    : "border-white/15 bg-white/5 text-white/70 hover:border-orange-400/40 hover:text-white/90"
                }`}
            >
              No
            </button>
          </div>

          {relatable === true && (
            <div className="animate-fadeIn">
              <label
                htmlFor="meme-how"
                className="block text-xs uppercase tracking-widest text-purple-300/80 mb-2 font-mono"
              >
                If yes — how?
              </label>
              <textarea
                id="meme-how"
                value={howText}
                onChange={(e) => setHowText(e.target.value)}
                placeholder="What clicked? Same energy as your sprint, inside joke, timing…"
                rows={3}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/30 transition-all resize-none font-mono text-sm"
              />
            </div>
          )}

          {fbError && (
            <p className="text-center text-red-400/90 font-mono text-xs">{fbError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center pt-2">
            <button
              type="button"
              onClick={submitFeedback}
              disabled={relatable === null || (relatable === true && howText.trim().length < 8)}
              className={`px-8 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest transition-all
                ${
                  relatable !== null && !(relatable === true && howText.trim().length < 8)
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_24px_rgba(120,80,255,0.25)] cursor-pointer active:scale-[0.98]"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                }`}
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={skipFeedback}
              className="text-white/35 hover:text-white/55 font-mono text-xs uppercase tracking-widest underline-offset-4 hover:underline cursor-pointer transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {phase === "submitting" && (
        <div className="glass rounded-2xl p-6 text-center font-mono text-sm text-white/50">
          <span className="inline-block w-5 h-5 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin align-middle mr-2" />
          Sending…
        </div>
      )}

      {(phase === "done" || phase === "skipped") && (
        <p className="text-center font-mono text-sm text-white/45">
          {phase === "done" ? (
            <span className="text-green-400/90">Thanks — your feedback was saved.</span>
          ) : (
            <span>No worries. You can still share another vibe below.</span>
          )}
        </p>
      )}

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

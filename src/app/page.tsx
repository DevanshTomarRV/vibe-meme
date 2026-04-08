"use client";

import { useState, useCallback } from "react";
import RatingButton from "./components/RatingButton";
import LoadingState from "./components/LoadingState";

interface VibeResponse {
  richnessScore: number;
  aiComment: string;
  memeUrl: string;
}

type AppState = "login" | "form" | "loading" | "success" | "error";

export default function Home() {
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [appState, setAppState] = useState<AppState>("login");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(() => {
    if (userName.trim().length > 0) {
      setAppState("form");
    }
  }, [userName]);

  const handleSubmit = useCallback(async () => {
    if (!rating || !explanation.trim()) return;

    setAppState("loading");
    setError(null);

    try {
      const res = await fetch("/api/evaluate-vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          explanation: explanation.trim(),
          userName: userName.trim(),
        }),
      });

      const data: VibeResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setAppState("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setAppState("error");
    }
  }, [rating, explanation, userName]);

  const handleReset = () => {
    setRating(null);
    setExplanation("");
    setError(null);
    setAppState("form");
  };

  const isFormValid = rating !== null && explanation.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-4 py-12 sm:py-20">
      {/* Header */}
      <header className="text-center mb-12 animate-float">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="neon-text-purple">Meme</span>{" "}
          <span className="neon-text-cyan">Vibe</span>
        </h1>
        <p className="text-sm sm:text-base text-white/50 font-mono tracking-widest uppercase">
          Sprint Retrospective — Multiplayer
        </p>
        <p className="text-xs text-white/30 mt-2 font-mono">
          Greek Space Opera × New Age Meme Culture
        </p>
      </header>

      {/* Login State */}
      {appState === "login" && (
        <div className="w-full max-w-md glass-strong rounded-2xl p-6 sm:p-10 animate-fadeIn">
          <label
            htmlFor="userName"
            className="block text-sm uppercase tracking-widest text-cyan-300/80 mb-4 font-mono"
          >
            Enter Your Name, Traveler
          </label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="e.g. Odysseus of Sprint-42"
            autoFocus
            className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-4 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all font-mono text-sm mb-6"
          />
          <button
            onClick={handleLogin}
            disabled={userName.trim().length === 0}
            className={`
              w-full py-4 rounded-xl font-mono font-bold text-lg uppercase tracking-widest
              transition-all duration-300 cursor-pointer
              ${
                userName.trim().length > 0
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_30px_rgba(120,80,255,0.3)] hover:shadow-[0_0_40px_rgba(120,80,255,0.5)] active:scale-[0.98]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }
            `}
          >
            Enter the Arena
          </button>
        </div>
      )}

      {/* Form State */}
      {appState === "form" && (
        <div className="w-full max-w-2xl glass-strong rounded-2xl p-6 sm:p-10 animate-fadeIn">
          <p className="text-center text-white/50 font-mono text-sm mb-8">
            Welcome, <span className="text-cyan-300">{userName}</span>
          </p>

          {/* Rating Section */}
          <div className="mb-8">
            <label className="block text-sm uppercase tracking-widest text-cyan-300/80 mb-4 font-mono">
              How was your sprint?
            </label>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <RatingButton
                  key={value}
                  value={value}
                  selected={rating === value}
                  onClick={setRating}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/30 mt-3 px-2 font-mono">
              <span>Dumpster Fire</span>
              <span>Legendary</span>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="mb-8">
            <label
              htmlFor="explanation"
              className="block text-sm uppercase tracking-widest text-cyan-300/80 mb-4 font-mono"
            >
              Tell us why
            </label>
            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Spill the cosmic tea... What made this sprint a saga for the ages (or a cautionary tale)?"
              rows={5}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-5 py-4 text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`
              w-full py-4 rounded-xl font-mono font-bold text-lg uppercase tracking-widest
              transition-all duration-300 cursor-pointer
              ${
                isFormValid
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_30px_rgba(120,80,255,0.3)] hover:shadow-[0_0_40px_rgba(120,80,255,0.5)] active:scale-[0.98]"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }
            `}
          >
            ⚡ Vibe Check ⚡
          </button>
        </div>
      )}

      {/* Loading State */}
      {appState === "loading" && <LoadingState />}

      {/* Success State */}
      {appState === "success" && (
        <div className="w-full max-w-lg mx-auto mt-10 animate-fadeIn">
          <div className="glass-strong rounded-2xl p-10 text-center">
            <div className="text-6xl mb-6">✅</div>
            <p className="text-2xl font-bold font-mono neon-text-cyan mb-3">
              Vibe Submitted!
            </p>
            <p className="text-white/50 font-mono text-sm leading-relaxed mb-8">
              Your retro has been beamed to the mothership.
              <br />
              <span className="text-purple-300">Look at the main screen</span> to see your meme play live.
            </p>
            <div className="glass rounded-xl p-4 inline-block">
              <p className="text-xs text-white/30 font-mono uppercase tracking-widest">
                Waiting for Admin to reveal...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {appState === "error" && (
        <div className="w-full max-w-2xl mx-auto mt-10">
          <div className="glass-strong rounded-2xl p-8 text-center border border-red-500/30">
            <div className="text-4xl mb-4">💥</div>
            <p className="text-red-400 font-mono text-lg mb-2">Vibe Check Failed</p>
            <p className="text-white/50 text-sm mb-6 font-mono">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-mono text-sm transition-all cursor-pointer"
            >
              ↺ Try Again
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-white/20 font-mono">
        <p>Meme Vibe v0.2 — Multiplayer Edition</p>
      </footer>
    </main>
  );
}

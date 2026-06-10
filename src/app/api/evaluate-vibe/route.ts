import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";
import { canonicalMemeKey } from "@/lib/youtubeEmbed";

interface VibeRequest {
  rating: number;
  explanation: string;
  userName: string;
}

interface ModelGradeFlags {
  richnessScore: number;
  nonsenseSlop: boolean;
  poorEnglish: boolean;
  extremeBrainrot: boolean;
}

interface MemeMatch {
  id: string;
  title: string;
  video_url: string;
  semantic_context: string;
  similarity: number;
}

/**
 * How much user sprint rating vs meme `base_rating` can nudge ordering.
 * Kept small so a clearly better semantic match almost always wins.
 */
const RATING_TIEBREAK_WEIGHT = 0.022;

/** When the bouncer flags word-slop, pick from this pool (≥3 clips so last-2 exclusion is always satisfiable). */
const WORD_SLOP_CLIPS = [
  {
    url: "https://www.youtube.com/embed/Rt82LroisVA?autoplay=1&mute=0",
    title: "Word slop / gibberish (not a language)",
    vibe: "Baffled comedic disbelief—someone submitted keyboard entropy instead of a retro. Roast gently; keep it generic (no named politicians).",
  },
  {
    url: "https://www.youtube.com/embed/yS55oeuy-X0?autoplay=1&mute=0&start=3",
    title: "Confused John Travolta",
    vibe: "Complete disorientation—'what did I just read?' energy; comedic confusion that this was submitted as a retro.",
  },
  {
    url: "https://www.youtube.com/embed/VqB1uoDTdKM?autoplay=1&mute=0",
    title: "Hell Elmo",
    vibe: "Chaotic unhinged acceptance of nonsense—darkly funny reaction to text that should not exist in a professional retro.",
  },
] as const;

const POOR_ENGLISH_CLIPS = [
  {
    url: "https://www.youtube.com/embed/s6rTyLNZxPE?autoplay=1&mute=0",
    title: "Grammar / spelling roast",
    vibe: "English-teacher meltdown energy—tell them clearly to improve spelling and grammar before the next retro; firm but not cruel.",
  },
  {
    url: "https://www.youtube.com/embed/MwOH0gzG4wc?autoplay=1&mute=0",
    title: "Poor English shame (alternate clip)",
    vibe: "Same job as grammar roast—written English needs work; comedic shame, not bullying.",
  },
  {
    url: "https://www.youtube.com/embed/OtCgV3UBii4?autoplay=1&mute=0",
    title: "Poor English shame (variant)",
    vibe: "Same job—typos and broken tense in a professional retro; push them to level up English.",
  },
] as const;

const LAZY_LANE_CLIPS = [
  {
    url: "https://www.youtube.com/embed/eAmkg7TbkUc?autoplay=1&mute=0",
    title: "Anupama — “Main marungi” (soap-opera rage)",
    vibe: "Furious Indian TV mother / homework-not-done matriarch yelling—comedic theatrical rage, 'main marungi' exasperation—NEVER a credible threat of real violence. Loud and angry, not playful teasing.",
  },
  {
    url: "https://www.youtube.com/embed/LvUIySl7Xi4?autoplay=1&mute=0",
    title: "Uta aitha? (playful callout)",
    vibe: "Playful mischievous teasing—someone clearly phoned it in—light cheeky roast. NOT soap-opera matriarch rage.",
  },
] as const;

/** Anupama / Uta lazy lane only when the retro is ultra-short (word count, not model guess). */
const LAZY_LANE_MAX_WORDS = 3;

function retroWordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function memeKeysFromUrls(urls: readonly (string | null | undefined)[]): Set<string> {
  const keys = new Set<string>();
  for (const url of urls) {
    if (typeof url === "string" && url.length > 0) {
      keys.add(canonicalMemeKey(url));
    }
  }
  return keys;
}

function recentShowCountByMemeKey(
  urls: readonly (string | null | undefined)[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const url of urls) {
    if (typeof url === "string" && url.length > 0) {
      const key = canonicalMemeKey(url);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Most recent show per meme in desc-ordered history; index = submissions since that show. */
function lastShowIndexByMemeKey(
  urls: readonly (string | null | undefined)[],
): Map<string, number> {
  const lastIndex = new Map<string, number>();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (typeof url === "string" && url.length > 0) {
      const key = canonicalMemeKey(url);
      if (!lastIndex.has(key)) {
        lastIndex.set(key, i);
      }
    }
  }
  return lastIndex;
}

function staleMemeBoost(
  memeKey: string,
  lastShowIndexByKey: Map<string, number>,
): number {
  const lastIndex = lastShowIndexByKey.get(memeKey);
  if (lastIndex === undefined) {
    return STALE_MEME_BOOST_MAX;
  }
  const staleness = Math.min(1, lastIndex / STALE_MEME_BOOST_FULL_AT);
  return STALE_MEME_BOOST_MAX * staleness;
}

function pickFromPoolAvoidingRecentKeys<T extends { url: string }>(
  clips: readonly T[],
  recentKeys: Set<string>,
): T {
  const usable = clips.filter((c) => !recentKeys.has(canonicalMemeKey(c.url)));
  if (usable.length > 0) {
    return usable[Math.floor(Math.random() * usable.length)];
  }
  console.warn(
    "meme-diversity: every clip in this fixed pool matches a recent submission key; repeating (pool exhausted vs last-2 rule).",
  );
  return clips[Math.floor(Math.random() * clips.length)];
}

/** Do not suggest a meme whose URL appears in the last N global submissions. */
const RECENT_MEME_EXCLUSION_COUNT = 6;
/** Per-user: do not repeat any of this user's last N meme picks. */
const USER_RECENT_MEME_EXCLUSION_COUNT = 4;
/** How many recent submissions to scan for popularity decay (not a hard ban). */
const POPULARITY_DECAY_WINDOW = 25;
/** How far back to look for last time each meme was shown (staleness boost). */
const STALE_TRACKING_WINDOW = 40;
/** Max score bonus for memes absent from recent history—small vs similarity (~0.5–0.9). */
const STALE_MEME_BOOST_MAX = 0.016;
/** Submissions since last show before a meme earns the full staleness bonus. */
const STALE_MEME_BOOST_FULL_AT = 15;
/** Score penalty per recent show in the decay window—nudges overused memes down, not out. */
const POPULARITY_DECAY_PER_SHOW = 0.02;
/** Ask RPC for enough rows to find a good alternative after exclusions. */
const MEME_MATCH_CANDIDATE_POOL = 55;
/** Self-rated 5/5 plus at least this richness nudges toward peak-swagger “ehh boy” tier (above cute-good band). */
const LEGENDARY_RATING_MEME_MIN_RICHNESS = 60;
/** With rating 4–5 and richness at least this (and not in the legendary tier above), nudge toward wholesome “cute / all good” memes. */
const CUTE_GOOD_VIBES_MIN_RICHNESS = 40;
/** Only this clip gets the optional poster-child Brainrot bouncer bit (not every chronically-online retro). */
const POSTER_CHILD_BRAINROT_MEME_KEY = "yt:tzD9OxAHtzU";

interface BouncerFlagSnapshot {
  nonsenseSlop: boolean;
  poorEnglish: boolean;
  extremeBrainrot: boolean;
}

async function generateAiCommentForMeme(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  params: {
    rating: number;
    explanation: string;
    memeTitle: string;
    memeVibe: string;
    memeUrl: string;
    flags: BouncerFlagSnapshot;
  },
): Promise<string> {
  const { rating, explanation, memeTitle, memeVibe, flags } = params;
  const isPosterChildBrainrotClip =
    canonicalMemeKey(params.memeUrl) === POSTER_CHILD_BRAINROT_MEME_KEY;
  const extras: string[] = [];
  if (flags.nonsenseSlop) {
    extras.push(
      "Their text is not coherent natural language—baffled comedic roast; keep it generic (no named politicians or rally clips).",
    );
  }
  if (flags.poorEnglish) {
    extras.push(
      "They were flagged for poor English—you MUST ask them to improve spelling and grammar before the next retro; direct but not cruel.",
    );
  }
  if (flags.extremeBrainrot && !isPosterChildBrainrotClip) {
    extras.push(
      "Their write-up has chronically-online meme energy—roast in this clip's voice with varied slang; don't reach for brainrot as a default insult.",
    );
  }
  if (isPosterChildBrainrotClip) {
    extras.push(
      "This clip is the poster-child Brainrot Short—you may naturally work in 'you are the poster child of Brainrot' once if it fits the roast; skip it if a different punchline lands better. Don't stack brainrot on top of that.",
    );
  }

  const prompt = `You are the AI Bouncer at a sprint retro party. The room will play ONE meme clip, then show your line on screen—your tone must match that clip, not a different meme's energy.

Sprint self-rating: ${rating}/5
Engineer's explanation: ${JSON.stringify(explanation)}

Meme clip title: ${memeTitle}
How this clip feels (your voice MUST match this—same emotional register as the video):
${memeVibe}

${extras.length > 0 ? `Additional rules:\n${extras.join("\n")}\n` : ""}
General rules:
- One or two short sentences in JSON field aiComment only.
- Vary your roasts—brainrot and catchphrase insults are occasional flavor, not your go-to every time unless this clip clearly calls for it.
- If the clip vibe is angry matriarch soap rage, be loud and theatrical (still comedic safe—no credible threat of real violence). If the vibe is playful teasing, stay light and mischievous—not the angry matriarch voice.
- Do not name Mamata Banerjee or other specific politician rally memes unless the clip title/vibe above already implies that genre.

Return a JSON object with exactly this key: { "aiComment": string }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error("Empty bouncer comment response");
  }
  const cleaned = text
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned) as { aiComment?: string };
  if (typeof parsed.aiComment !== "string" || parsed.aiComment.trim().length === 0) {
    throw new Error("Invalid bouncer comment JSON");
  }
  return parsed.aiComment.trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Set GEMINI_API_KEY in your .env.local file." },
      { status: 500 },
    );
  }

  let body: VibeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { rating, explanation, userName } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5." },
      { status: 400 },
    );
  }

  if (!explanation || explanation.trim().length === 0) {
    return NextResponse.json(
      { error: "Explanation is required." },
      { status: 400 },
    );
  }

  if (!userName || userName.trim().length === 0) {
    return NextResponse.json(
      { error: "User name is required." },
      { status: 400 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const chatModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });

  try {
    const supabase = getSupabase();
    const trimmedUserName = userName.trim();

    const [
      { data: recentRows, error: recentError },
      { data: userRecentRows, error: userRecentError },
      { data: popularityRows, error: popularityError },
    ] = await Promise.all([
      supabase
        .from("sprint_submissions")
        .select("meme_url")
        .order("created_at", { ascending: false })
        .limit(RECENT_MEME_EXCLUSION_COUNT),
      supabase
        .from("sprint_submissions")
        .select("meme_url")
        .eq("user_name", trimmedUserName)
        .order("created_at", { ascending: false })
        .limit(USER_RECENT_MEME_EXCLUSION_COUNT),
      supabase
        .from("sprint_submissions")
        .select("meme_url")
        .order("created_at", { ascending: false })
        .limit(STALE_TRACKING_WINDOW),
    ]);

    if (recentError) {
      console.error("recent submissions fetch error:", recentError.message);
    }
    if (userRecentError) {
      console.error("user recent submissions fetch error:", userRecentError.message);
    }
    if (popularityError) {
      console.error("popularity window fetch error:", popularityError.message);
    }

    const recentMemeKeys = memeKeysFromUrls([
      ...(recentRows ?? []).map((row) => row.meme_url),
      ...(userRecentRows ?? []).map((row) => row.meme_url),
    ]);
    const popularityMemeUrls = (popularityRows ?? []).map((row) => row.meme_url);
    const recentShowCounts = recentShowCountByMemeKey(
      popularityMemeUrls.slice(0, POPULARITY_DECAY_WINDOW),
    );
    const lastShowIndexByKey = lastShowIndexByMemeKey(popularityMemeUrls);

    // ── Step 1: Grade only (no aiComment—the clip is chosen first, then the line matches it) ─

    const gradePrompt = `You are an AI Bouncer evaluating an engineer's sprint retrospective. Grade richness only (no aiComment in this step).

Set nonsenseSlop to true if the explanation is not coherent natural language at all—pure keyboard mash, random symbol soup, meaningless token salad, emoji spam with no sentences, or so broken that it is not really words in any language (not merely bad English—there must be no decipherable linguistic content). If nonsenseSlop is true: set poorEnglish to false, set extremeBrainrot to false, and richnessScore should be extremely low (0–20). Otherwise nonsenseSlop is false.

Set poorEnglish to true only if nonsenseSlop is false AND the explanation is hard to follow as English prose: many repeated spelling errors, mangled tense or word order throughout, or sentence fragments stacked so the reader has to guess the intent. Do NOT set poorEnglish for: a few typos, casual or chatty tone, light slang, non-native phrasing that is still clear, bullet fragments, or informal register. When in doubt, prefer false.

Set extremeBrainrot to true if nonsenseSlop is false AND poorEnglish is false AND the write-up is distinctly chronically-online meme dialect: meme-caption logic, stacked absurd references, TikTok-style hype, or unserious internet recap sludge—not casual chat, a lone slang word, or a ultra-short lazy answer. Not keyboard gibberish (nonsenseSlop) and not mainly grammar issues (poorEnglish).

Return a JSON object with exactly these keys: { "richnessScore": number, "nonsenseSlop": boolean, "poorEnglish": boolean, "extremeBrainrot": boolean }

Sprint Rating: ${rating}/5

Explanation (verbatim user text as a JSON string — do not echo it as raw JSON structure): ${JSON.stringify(explanation)}`;

    const gradeResult = await chatModel.generateContent(gradePrompt);
    const gradeText = gradeResult.response.text();

    if (!gradeText) {
      return NextResponse.json(
        { error: "No response from AI. Try again." },
        { status: 502 },
      );
    }

    const gradeCleaned = gradeText
      .replace(/```(?:json)?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let graded: ModelGradeFlags;
    try {
      graded = JSON.parse(gradeCleaned) as ModelGradeFlags;
    } catch {
      const retry = await chatModel.generateContent(
        `${gradePrompt}\n\nIMPORTANT: Your previous reply was not valid JSON. Reply with ONE minified JSON object only—no markdown, no prose. Use lowercase true/false.`,
      );
      const retryText = retry.response.text();
      if (!retryText) {
        return NextResponse.json(
          { error: "No response from AI. Try again." },
          { status: 502 },
        );
      }
      const retryClean = retryText
        .replace(/```(?:json)?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      graded = JSON.parse(retryClean) as ModelGradeFlags;
    }

    if (typeof graded.richnessScore !== "number") {
      return NextResponse.json(
        { error: "Unexpected AI response format." },
        { status: 502 },
      );
    }

    const nonsenseSlop = graded.nonsenseSlop === true;
    const poorEnglish = !nonsenseSlop && graded.poorEnglish === true;
    const extremeBrainrot =
      !nonsenseSlop && !poorEnglish && graded.extremeBrainrot === true;
    const wc = retroWordCount(explanation);
    const thinLazyRetro =
      wc >= 1 &&
      wc <= LAZY_LANE_MAX_WORDS &&
      !nonsenseSlop &&
      !poorEnglish &&
      !extremeBrainrot;

    const flags: BouncerFlagSnapshot = { nonsenseSlop, poorEnglish, extremeBrainrot };

    // ── Step 2: Pick meme URL + metadata for the bouncer to match ─────────────

    let memeUrl: string;
    let memeTitle: string;
    let memeVibe: string;

    if (nonsenseSlop) {
      const clip = pickFromPoolAvoidingRecentKeys(WORD_SLOP_CLIPS, recentMemeKeys);
      memeUrl = clip.url;
      memeTitle = clip.title;
      memeVibe = clip.vibe;
    } else if (poorEnglish) {
      const clip = pickFromPoolAvoidingRecentKeys(POOR_ENGLISH_CLIPS, recentMemeKeys);
      memeUrl = clip.url;
      memeTitle = clip.title;
      memeVibe = clip.vibe;
    } else if (thinLazyRetro) {
      const clip = pickFromPoolAvoidingRecentKeys(LAZY_LANE_CLIPS, recentMemeKeys);
      memeUrl = clip.url;
      memeTitle = clip.title;
      memeVibe = clip.vibe;
    } else {
      const trimmedExplanation = explanation.trim();
      let explanationForMemeEmbedding = trimmedExplanation;

      if (
        rating === 5 &&
        graded.richnessScore >= LEGENDARY_RATING_MEME_MIN_RICHNESS
      ) {
        explanationForMemeEmbedding += `\n\n(They self-rated this sprint 5/5 legendary and the write-up reads like someone genuinely on top of their game—clear wins, momentum, crushing it with receipts, peak form, swagger that is earned.)`;
      } else if (
        (rating === 4 || rating === 5) &&
        graded.richnessScore >= CUTE_GOOD_VIBES_MIN_RICHNESS
      ) {
        explanationForMemeEmbedding += `\n\n(They rated this sprint 4 or 5 with solid richness—warm wholesome "everything is good" cute retro energy, or if the text is a chaotic celebratory shout / unserious internet hype, still pick by semantic fit to the closest meme in the library without naming specific clips.)`;
      } else if (rating === 4 || rating === 5) {
        explanationForMemeEmbedding += `\n\n(Self-rated sprint 4 or 5; celebratory or internet-hype write-ups even with middling richness—pick the closest semantic meme match from the library.)`;
      }

      const embeddingResult = await embeddingModel.embedContent(explanationForMemeEmbedding);
      const userVector = embeddingResult.embedding.values.slice(0, 768);

      const { data: matches, error: rpcError } = await supabase.rpc("match_memes", {
        query_embedding: JSON.stringify(userVector),
        match_threshold: 0.1,
        match_count: MEME_MATCH_CANDIDATE_POOL,
      });

      if (rpcError) {
        console.error("match_memes RPC error:", rpcError.message);
        return NextResponse.json(
          { error: `Meme matching failed: ${rpcError.message}` },
          { status: 502 },
        );
      }

      const memeResults = matches as MemeMatch[];
      if (!memeResults || memeResults.length === 0) {
        return NextResponse.json(
          { error: "No matching meme found." },
          { status: 502 },
        );
      }

      const ids = memeResults.map((m) => m.id).filter((id): id is string => Boolean(id));
      const baseRatingById = new Map<string, number>();
      if (ids.length > 0) {
        const { data: metaRows, error: metaErr } = await supabase
          .from("meme_contexts")
          .select("id, base_rating")
          .in("id", ids);
        if (metaErr) {
          console.error("meme_contexts meta fetch error:", metaErr.message);
        }
        for (const row of metaRows ?? []) {
          if (row.id != null && typeof row.base_rating === "number") {
            baseRatingById.set(String(row.id), row.base_rating);
          }
        }
      }

      const memeMatchScore = (meme: MemeMatch): number => {
        const br = baseRatingById.get(meme.id) ?? 3;
        const align = 1 - Math.min(4, Math.abs(rating - br)) / 4;
        const memeKey = canonicalMemeKey(meme.video_url);
        const popularityPenalty =
          POPULARITY_DECAY_PER_SHOW * (recentShowCounts.get(memeKey) ?? 0);
        const freshnessBoost = staleMemeBoost(memeKey, lastShowIndexByKey);
        return (
          meme.similarity + RATING_TIEBREAK_WEIGHT * align - popularityPenalty + freshnessBoost
        );
      };

      const ranked = [...memeResults].sort(
        (a, b) => memeMatchScore(b) - memeMatchScore(a),
      );

      const bestMeme =
        ranked.find((m) => !recentMemeKeys.has(canonicalMemeKey(m.video_url))) ?? ranked[0];

      if (recentMemeKeys.has(canonicalMemeKey(bestMeme.video_url))) {
        console.warn(
          "meme-diversity: all RPC candidates matched a recent submission key; using top similarity match.",
        );
      }

      memeUrl = bestMeme.video_url;
      memeTitle = bestMeme.title ?? "Matched meme";
      const ctx = bestMeme.semantic_context ?? "";
      memeVibe = ctx.length > 500 ? `${ctx.slice(0, 500)}…` : ctx;
    }

    // ── Step 3: Bouncer line matched to the clip actually shown ───────────────

    let aiComment: string;
    try {
      aiComment = await generateAiCommentForMeme(chatModel, {
        rating,
        explanation: explanation.trim(),
        memeTitle,
        memeVibe,
        memeUrl,
        flags,
      });
    } catch (e) {
      console.error("Bouncer comment generation failed:", e);
      return NextResponse.json(
        { error: "AI bouncer comment failed. Try again." },
        { status: 502 },
      );
    }

    // ── Step 4: Save submission ───────────────────────────────────────────────

    const { data: insertedRow, error: insertError } = await supabase
      .from("sprint_submissions")
      .insert({
        user_name: userName.trim(),
        rating,
        explanation: explanation.trim(),
        richness_score: graded.richnessScore,
        ai_comment: aiComment,
        meme_url: memeUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("sprint_submissions insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to save submission: ${insertError.message}` },
        { status: 502 },
      );
    }

    // ── Step 5: Return response ─────────────────────────────────────────────

    return NextResponse.json({
      submissionId: insertedRow.id,
      richnessScore: graded.richnessScore,
      aiComment,
      memeUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Evaluate-vibe error:", message);
    return NextResponse.json(
      { error: `AI evaluation failed: ${message}` },
      { status: 502 },
    );
  }
}

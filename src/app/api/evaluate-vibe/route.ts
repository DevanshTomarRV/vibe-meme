import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

interface VibeRequest {
  rating: number;
  explanation: string;
  userName: string;
}

interface VibeResult {
  richnessScore: number;
  aiComment: string;
}

interface MemeMatch {
  id: string;
  title: string;
  video_url: string;
  semantic_context: string;
  similarity: number;
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
    // ── Step 1: Grade the explanation with Gemini 2.5 Flash ─────────────────

    const prompt = `You are an AI Bouncer evaluating an engineer's sprint retrospective. Grade their response out of 100 based on "richness" (how detailed and insightful it is, not just complaining). Also, extract a 1-sentence witty roast or hype-up based on their text.

Return a JSON object with exactly these keys: { "richnessScore": number, "aiComment": string }

Sprint Rating: ${rating}/5

Explanation: ${explanation}`;

    const gradeResult = await chatModel.generateContent(prompt);
    const content = gradeResult.response.text();

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI. Try again." },
        { status: 502 },
      );
    }

    const cleaned = content
      .replace(/```(?:json)?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed: VibeResult = JSON.parse(cleaned);

    if (typeof parsed.richnessScore !== "number" || typeof parsed.aiComment !== "string") {
      return NextResponse.json(
        { error: "Unexpected AI response format." },
        { status: 502 },
      );
    }

    // ── Step 2: Embed the user's explanation ────────────────────────────────

    const embeddingResult = await embeddingModel.embedContent(explanation);
    const userVector = embeddingResult.embedding.values.slice(0, 768);

    // ── Step 3: Vector search for the best matching meme ────────────────────

    const supabase = getSupabase();

    const { data: matches, error: rpcError } = await supabase.rpc("match_memes", {
      query_embedding: JSON.stringify(userVector),
      match_threshold: 0.1,
      match_count: 1,
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

    const bestMeme = memeResults[0];
    const memeUrl = bestMeme.video_url;

    // ── Step 4: Save submission to sprint_submissions ───────────────────────

    const { error: insertError } = await supabase
      .from("sprint_submissions")
      .insert({
        user_name: userName.trim(),
        rating,
        explanation: explanation.trim(),
        richness_score: parsed.richnessScore,
        ai_comment: parsed.aiComment,
        meme_url: memeUrl,
      });

    if (insertError) {
      console.error("sprint_submissions insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to save submission: ${insertError.message}` },
        { status: 502 },
      );
    }

    // ── Step 5: Return response ─────────────────────────────────────────────

    return NextResponse.json({
      richnessScore: parsed.richnessScore,
      aiComment: parsed.aiComment,
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

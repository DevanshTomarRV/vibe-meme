import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMemeUrl } from "@/lib/videoMap";

interface VibeRequest {
  rating: number;
  explanation: string;
}

interface VibeResult {
  richnessScore: number;
  aiComment: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Set GEMINI_API_KEY in your .env.local file." },
      { status: 500 }
    );
  }

  let body: VibeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { rating, explanation } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5." },
      { status: 400 }
    );
  }

  if (!explanation || explanation.trim().length === 0) {
    return NextResponse.json(
      { error: "Explanation is required." },
      { status: 400 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  try {
    const prompt = `You are an AI Bouncer evaluating an engineer's sprint retrospective. Grade their response out of 100 based on "richness" (how detailed and insightful it is, not just complaining). Also, extract a 1-sentence witty roast or hype-up based on their text.

Return a JSON object with exactly these keys: { "richnessScore": number, "aiComment": string }

Sprint Rating: ${rating}/5

Explanation: ${explanation}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI. Try again." },
        { status: 502 }
      );
    }

    const cleaned = content.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed: VibeResult = JSON.parse(cleaned);

    if (typeof parsed.richnessScore !== "number" || typeof parsed.aiComment !== "string") {
      return NextResponse.json(
        { error: "Unexpected AI response format." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      richnessScore: parsed.richnessScore,
      aiComment: parsed.aiComment,
      memeUrl: getMemeUrl(rating),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Gemini API error:", message);
    return NextResponse.json(
      { error: `AI evaluation failed: ${message}` },
      { status: 502 }
    );
  }
}

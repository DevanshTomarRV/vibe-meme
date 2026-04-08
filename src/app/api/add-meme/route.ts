import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabase } from "@/lib/supabase";

interface AddMemeRequest {
  id: string;
  title: string;
  base_rating: number;
  video_url: string;
  cultural_tags: string[];
  semantic_context: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured." },
      { status: 500 },
    );
  }

  let body: AddMemeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { id, title, base_rating, video_url, cultural_tags, semantic_context } = body;

  if (!id || !id.trim()) {
    return NextResponse.json({ error: "ID is required." }, { status: 400 });
  }
  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!base_rating || base_rating < 1 || base_rating > 5) {
    return NextResponse.json({ error: "Base rating must be between 1 and 5." }, { status: 400 });
  }
  if (!video_url || !video_url.trim()) {
    return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
  }
  if (!semantic_context || semantic_context.trim().length < 10) {
    return NextResponse.json({ error: "Semantic context must be at least 10 characters." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });

    const embeddingResult = await embeddingModel.embedContent(semantic_context);
    const embedding = embeddingResult.embedding.values.slice(0, 768);

    const supabase = getSupabase();

    const { error: insertError } = await supabase.from("meme_contexts").insert({
      id: id.trim(),
      title: title.trim(),
      base_rating,
      video_url: video_url.trim(),
      cultural_tags: cultural_tags.map((t) => t.trim()).filter(Boolean),
      semantic_context: semantic_context.trim(),
      rlhf_score: 0,
      embedding: JSON.stringify(embedding),
    });

    if (insertError) {
      console.error("meme_contexts insert error:", insertError.message);
      return NextResponse.json(
        { error: `Failed to insert meme: ${insertError.message}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      meme: { id: id.trim(), title: title.trim(), dimensions: embedding.length },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Add-meme error:", message);
    return NextResponse.json(
      { error: `Failed to add meme: ${message}` },
      { status: 502 },
    );
  }
}

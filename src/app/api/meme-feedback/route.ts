import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface MemeFeedbackBody {
  submissionId: string;
  relatable: boolean;
  /** Required when relatable is true */
  how?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MIN_HOW_LEN = 8;

export async function POST(request: NextRequest) {
  let body: MemeFeedbackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { submissionId, relatable, how } = body;

  if (!submissionId || typeof submissionId !== "string" || !UUID_RE.test(submissionId)) {
    return NextResponse.json({ error: "Valid submissionId is required." }, { status: 400 });
  }

  if (typeof relatable !== "boolean") {
    return NextResponse.json({ error: "relatable must be true or false." }, { status: 400 });
  }

  if (relatable) {
    const detail = typeof how === "string" ? how.trim() : "";
    if (detail.length < MIN_HOW_LEN) {
      return NextResponse.json(
        { error: `When the meme was relatable, please add at least ${MIN_HOW_LEN} characters explaining how.` },
        { status: 400 },
      );
    }
  }

  const supabase = getSupabase();

  const { error } = await supabase.from("meme_feedback").insert({
    submission_id: submissionId,
    relatable,
    relatable_how: relatable ? (how as string).trim() : null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "Unknown submission." }, { status: 404 });
    }
    console.error("meme_feedback insert error:", error.message);
    return NextResponse.json(
      { error: `Could not save feedback: ${error.message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

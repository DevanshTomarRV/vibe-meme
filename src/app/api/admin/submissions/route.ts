import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function fetchFeedbackForIds(
  supabase: ReturnType<typeof getSupabase>,
  ids: string[],
) {
  const feedbackBySubmission = new Map<
    string,
    { relatable: boolean; relatable_how: string | null }[]
  >();

  if (ids.length === 0) {
    return feedbackBySubmission;
  }

  const { data: fbRows, error: fbErr } = await supabase
    .from("meme_feedback")
    .select("submission_id, relatable, relatable_how")
    .in("submission_id", ids);

  if (fbErr) {
    console.error("admin meme_feedback fetch:", fbErr.message);
    return feedbackBySubmission;
  }

  for (const row of fbRows ?? []) {
    const sid = row.submission_id as string;
    const bucket = feedbackBySubmission.get(sid) ?? [];
    bucket.push({
      relatable: row.relatable as boolean,
      relatable_how: (row.relatable_how as string | null) ?? null,
    });
    feedbackBySubmission.set(sid, bucket);
  }

  return feedbackBySubmission;
}

/**
 * Lists sprint submissions for the admin dashboard.
 * Runs on the server (same env path as /api/evaluate-vibe) so Vercel does not depend
 * on NEXT_PUBLIC_* being inlined into the browser bundle.
 *
 * Query params:
 *   since — ISO timestamp; return only rows newer than this (for live polling).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const since = request.nextUrl.searchParams.get("since");

    // Two queries: PostgREST nested `meme_feedback(...)` requires an FK in the schema
    // cache; some projects lack it or use a different layout, which breaks embeds.
    let subQuery = supabase
      .from("sprint_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (since) {
      subQuery = subQuery.gt("created_at", since);
    }

    const { data: rows, error: subErr } = await subQuery;

    if (subErr) {
      console.error("admin submissions fetch:", subErr.message);
      return NextResponse.json(
        { error: subErr.message, submissions: [] },
        { status: 502 },
      );
    }

    const submissions = rows ?? [];
    const ids = submissions.map((s: { id: string }) => s.id).filter(Boolean);
    const feedbackBySubmission = await fetchFeedbackForIds(supabase, ids);

    const merged = submissions.map((s: { id: string }) => ({
      ...s,
      meme_feedback: feedbackBySubmission.get(s.id) ?? [],
    }));

    return NextResponse.json(
      { submissions: merged },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("admin submissions:", message);
    return NextResponse.json(
      { error: message, submissions: [] },
      { status: 500 },
    );
  }
}

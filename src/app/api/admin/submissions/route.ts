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
 * Returns the full submission list plus `total` (DB row count) so the client can
 * detect incomplete/cached responses and retry.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const [{ count: total, error: countErr }, { data: rows, error: subErr }] =
      await Promise.all([
        supabase
          .from("sprint_submissions")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("sprint_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);

    if (countErr) {
      console.error("admin submissions count:", countErr.message);
    }
    if (subErr) {
      console.error("admin submissions fetch:", subErr.message);
      return NextResponse.json(
        { error: subErr.message, submissions: [], total: total ?? 0 },
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
      { submissions: merged, total: total ?? merged.length },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          "CDN-Cache-Control": "no-store",
          Pragma: "no-cache",
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

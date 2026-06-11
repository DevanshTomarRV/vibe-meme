import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

type SubmissionRow = Record<string, unknown> & { id: string; created_at: string };

async function fetchAllSubmissions(
  supabase: ReturnType<typeof getSupabase>,
): Promise<{ rows: SubmissionRow[]; total: number }> {
  const all: SubmissionRow[] = [];
  let total = 0;
  let from = 0;

  while (true) {
    const { data, error, count } = await supabase
      .from("sprint_submissions")
      .select("*", { count: from === 0 ? "exact" : undefined })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    if (from === 0 && typeof count === "number") {
      total = count;
    }

    const page = (data ?? []) as SubmissionRow[];
    if (page.length === 0) {
      break;
    }

    all.push(...page);
    from += page.length;

    if (page.length < PAGE_SIZE) {
      break;
    }
    if (total > 0 && all.length >= total) {
      break;
    }
  }

  return { rows: all, total: Math.max(total, all.length) };
}

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
export async function GET() {
  try {
    const supabase = getSupabase();

    let rows: SubmissionRow[];
    let total: number;
    try {
      ({ rows, total } = await fetchAllSubmissions(supabase));
    } catch (subErr) {
      const message =
        subErr instanceof Error ? subErr.message : "Failed to load submissions";
      console.error("admin submissions fetch:", message);
      return NextResponse.json(
        { error: message, submissions: [], total: 0 },
        { status: 502 },
      );
    }

    const submissions = rows;
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

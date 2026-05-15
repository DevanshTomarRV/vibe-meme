import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Lists sprint submissions for the admin dashboard.
 * Runs on the server (same env path as /api/evaluate-vibe) so Vercel does not depend
 * on NEXT_PUBLIC_* being inlined into the browser bundle.
 */
export async function GET() {
  try {
    const supabase = getSupabase();

    // Two queries: PostgREST nested `meme_feedback(...)` requires an FK in the schema
    // cache; some projects lack it or use a different layout, which breaks embeds.
    const { data: rows, error: subErr } = await supabase
      .from("sprint_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (subErr) {
      console.error("admin submissions fetch:", subErr.message);
      return NextResponse.json(
        { error: subErr.message, submissions: [] },
        { status: 502 },
      );
    }

    const submissions = rows ?? [];
    const ids = submissions.map((s: { id: string }) => s.id).filter(Boolean);

    const feedbackBySubmission = new Map<
      string,
      { relatable: boolean; relatable_how: string | null }[]
    >();

    if (ids.length > 0) {
      const { data: fbRows, error: fbErr } = await supabase
        .from("meme_feedback")
        .select("submission_id, relatable, relatable_how")
        .in("submission_id", ids);

      if (fbErr) {
        console.error("admin meme_feedback fetch:", fbErr.message);
      } else {
        for (const row of fbRows ?? []) {
          const sid = row.submission_id as string;
          const bucket = feedbackBySubmission.get(sid) ?? [];
          bucket.push({
            relatable: row.relatable as boolean,
            relatable_how: (row.relatable_how as string | null) ?? null,
          });
          feedbackBySubmission.set(sid, bucket);
        }
      }
    }

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

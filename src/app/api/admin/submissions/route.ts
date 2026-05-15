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
    const { data, error } = await supabase
      .from("sprint_submissions")
      .select("*, meme_feedback ( relatable, relatable_how )")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("admin submissions fetch:", error.message);
      return NextResponse.json(
        { error: error.message, submissions: [] },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { submissions: data ?? [] },
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

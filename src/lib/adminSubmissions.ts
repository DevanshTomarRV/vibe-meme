import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

export interface MemeFeedbackRow {
  relatable: boolean;
  relatable_how: string | null;
}

export interface AdminSubmission {
  id: string;
  user_name: string;
  rating: number;
  explanation: string;
  richness_score: number;
  ai_comment: string;
  meme_url: string;
  created_at: string;
  meme_feedback: MemeFeedbackRow[];
}

const LIST_LIMIT = 5000;

export async function fetchAdminSubmissions(): Promise<{
  submissions: AdminSubmission[];
  error?: string;
}> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      submissions: [],
      error: "Supabase is not configured in the browser.",
    };
  }

  const { data: rows, error: subErr } = await supabase
    .from("sprint_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (subErr) {
    return { submissions: [], error: subErr.message };
  }

  const submissions = rows ?? [];
  const ids = submissions.map((s) => s.id).filter(Boolean);

  const feedbackBySubmission = new Map<string, MemeFeedbackRow[]>();
  if (ids.length > 0) {
    const { data: fbRows, error: fbErr } = await supabase
      .from("meme_feedback")
      .select("submission_id, relatable, relatable_how")
      .in("submission_id", ids);

    if (fbErr) {
      console.error("meme_feedback fetch:", fbErr.message);
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

  return {
    submissions: submissions.map((s) => ({
      id: s.id as string,
      user_name: s.user_name as string,
      rating: s.rating as number,
      explanation: s.explanation as string,
      richness_score: s.richness_score as number,
      ai_comment: s.ai_comment as string,
      meme_url: s.meme_url as string,
      created_at: s.created_at as string,
      meme_feedback: feedbackBySubmission.get(s.id as string) ?? [],
    })),
  };
}

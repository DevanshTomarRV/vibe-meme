import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _browserClient: SupabaseClient | null = null;

/** Browser Supabase client (anon key) for realtime subscriptions on the admin dashboard. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  if (_browserClient) return _browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  _browserClient = createClient(url, key);
  return _browserClient;
}

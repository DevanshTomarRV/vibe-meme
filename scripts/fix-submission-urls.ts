import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const URL_MAP: Record<string, string> = {
  "https://www.youtube.com/embed/gJzHkI1Eq0E?autoplay=1&mute=0": "https://www.youtube.com/embed/a3WnvDtDD2M?autoplay=1&mute=0",
  "https://www.youtube.com/embed/V6dKkX1I7eA?autoplay=1&mute=0": "https://www.youtube.com/embed/VzmiXHgeLf8?autoplay=1&mute=0",
  "https://www.youtube.com/embed/l5mY2n_w3tA?autoplay=1&mute=0": "https://giphy.com/embed/xUPGcC0R9QjyxkPnS8",
  "https://www.youtube.com/embed/e1_BCEmSmZA?autoplay=1&mute=0": "https://www.youtube.com/embed/yS55oeuy-X0?autoplay=1&mute=0",
  "https://www.youtube.com/embed/9Bv_A0eIebI?autoplay=1&mute=0": "https://giphy.com/embed/h0MTqLyvgG0Ss",
  "https://www.youtube.com/embed/KEkrWRHKhxw?autoplay=1&mute=0": "https://www.youtube.com/embed/fQGbXmkSArs?autoplay=1&mute=0",
  "https://www.youtube.com/embed/OexG3lWn1Qo?autoplay=1&mute=0": "https://giphy.com/embed/d2lcHJTG5Tscg",
  "https://www.youtube.com/embed/wEwB22y1i8g?autoplay=1&mute=0": "https://giphy.com/embed/32mC2kXYWCsg0",
  "https://www.youtube.com/embed/Cj-22E_L_uM?autoplay=1&mute=0": "https://www.youtube.com/embed/FKPiqAFt3Rk?autoplay=1&mute=0",
  "https://www.youtube.com/embed/S-Llvgz86cg?autoplay=1&mute=0": "https://www.youtube.com/embed/7PzwOiW8-n0?autoplay=1&mute=0",
  "https://www.youtube.com/embed/9G6Eebt_V7g?autoplay=1&mute=0": "https://giphy.com/embed/ghuvaCOI6GOoTX0RmH",
  "https://www.youtube.com/embed/tZ-B4V1BwN0?autoplay=1&mute=0": "https://giphy.com/embed/26BRuo6sLetdllPAQ",
  "https://www.youtube.com/embed/0BNejY1i8g?autoplay=1&mute=0": "https://giphy.com/embed/9rtpurjbqiqZXbBBet",
  "https://www.youtube.com/embed/e1mH3YQZzL8?autoplay=1&mute=0": "https://www.youtube.com/embed/vdVMKJ91q70?autoplay=1&mute=0",
  "https://www.youtube.com/embed/WbS1A_sE2vQ?autoplay=1&mute=0": "https://www.youtube.com/embed/MZ53pK2Y1ag?autoplay=1&mute=0",
  "https://www.youtube.com/embed/XgPZJp_iF_A?autoplay=1&mute=0": "https://giphy.com/embed/8OMbbhiAT3kd4chi33",
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalUpdated = 0;

  for (const [oldUrl, newUrl] of Object.entries(URL_MAP)) {
    const { data, error } = await supabase
      .from("sprint_submissions")
      .update({ meme_url: newUrl })
      .eq("meme_url", oldUrl)
      .select("id");

    if (error) {
      console.error(`  ✗ Error updating "${oldUrl}": ${error.message}`);
      continue;
    }

    const count = data?.length ?? 0;
    if (count > 0) {
      console.log(`  ✓ Updated ${count} submission(s) from old URL to new`);
      totalUpdated += count;
    }
  }

  console.log(`\nDone. Updated ${totalUpdated} submission record(s).`);
}

main().catch((err: unknown) => {
  console.error("Fix failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

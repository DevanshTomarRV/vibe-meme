import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const MIGRATION_PATH = join(__dirname, "migrations", "001_meme_feedback.sql");

function projectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

async function verifyTable(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.from("meme_feedback").select("id").limit(1);
  return !error;
}

async function runWithPg(dbUrl: string): Promise<void> {
  const { Client } = await import("pg");
  const sql = readFileSync(MIGRATION_PATH, "utf8");
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  if (await verifyTable()) {
    console.log("meme_feedback table already exists — nothing to do.");
    return;
  }

  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const ref = projectRefFromUrl(supabaseUrl);
    const sqlEditorUrl = ref
      ? `https://supabase.com/dashboard/project/${ref}/sql/new`
      : "https://supabase.com/dashboard";

    console.error("meme_feedback table is missing.\n");
    console.error("Option A — add a database URL to .env.local, then re-run:");
    console.error("  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...supabase.com:6543/postgres");
    console.error("  (Supabase → Project Settings → Database → Connection string → URI)\n");
    console.error("Option B — paste scripts/migrations/001_meme_feedback.sql in the SQL Editor:");
    console.error(`  ${sqlEditorUrl}\n`);
    process.exit(1);
  }

  console.log("Applying meme_feedback migration…");
  await runWithPg(dbUrl);

  if (!(await verifyTable())) {
    console.error("Migration ran but meme_feedback is still not visible. Wait a few seconds and retry.");
    process.exit(1);
  }

  console.log("Done — meme_feedback table is ready.");
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Migration failed:", message);
  process.exit(1);
});

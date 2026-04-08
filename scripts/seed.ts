import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// ── Meme seed data ────────────────────────────────────────────────────────────

interface MemeEntry {
  id: string;
  title: string;
  base_rating: number;
  video_url: string;
  cultural_tags: string[];
  semantic_context: string;
  rlhf_score: number;
}

const MEMES: MemeEntry[] = [
  {
    id: "pooja-behavior",
    title: "Pooja, What is this behavior?",
    base_rating: 1,
    video_url:
      "https://www.youtube.com/embed/GPLJVitGsso?autoplay=1&mute=1",
    cultural_tags: ["indian", "office", "drama", "chaos", "meeting"],
    semantic_context:
      "Bizarre unprofessional behavior in a meeting. Someone is acting completely out of line, ignoring all norms, doing exactly the opposite of what they should. Chaotic dysfunction, people not following process, absurd workplace drama, meetings going off the rails. Total lack of professionalism, someone causing a scene, disruptive conduct that leaves everyone stunned. What is this behavior, who acts like this, office chaos, the team is in shambles, nobody is following the rules.",
    rlhf_score: 0,
  },
  {
    id: "green-mile-tired",
    title: "I'm Tired Boss (Green Mile)",
    base_rating: 2,
    video_url:
      "https://www.youtube.com/embed/-3_IuPMya6k?autoplay=1&mute=1",
    cultural_tags: ["hollywood", "burnout", "exhaustion", "emotional"],
    semantic_context:
      "Complete exhaustion, burnout, fatigue from overwork. Emotionally and physically drained, running on fumes. Tired of the grind, worn out from back-to-back sprints, no energy left. Deep weariness, wanting to rest but can't stop. The weight of the world on your shoulders, chronic tiredness, just done with everything. Working late nights, weekend deployments, endless on-call rotations. I'm tired boss, I can't keep going like this, burned out, need a break, sprint fatigue, emotionally spent.",
    rlhf_score: 0,
  },
  {
    id: "this-is-fine",
    title: "This Is Fine",
    base_rating: 3,
    video_url:
      "https://www.youtube.com/embed/0oBx7Jg4m-o?autoplay=1&mute=1",
    cultural_tags: ["western", "denial", "fire", "calm", "meme-classic"],
    semantic_context:
      "Everything is on fire but pretending it's okay. Denial in the face of disaster, ignoring obvious problems, acting calm while chaos surrounds you. Production is down but nobody is panicking. Codebase is a dumpster fire but we're shipping anyway. Bugs everywhere, deadlines missed, tech debt piling up, but sure, everything is fine. Forced optimism, toxic positivity, ignoring red flags, the building is burning and I'm sipping coffee. Normalizing dysfunction, this is fine meme energy, calm in the storm while everything collapses.",
    rlhf_score: 0,
  },
  {
    id: "pedro-pascal-cry-laugh",
    title: "Pedro Pascal Laughing Then Crying",
    base_rating: 4,
    video_url:
      "https://www.youtube.com/embed/jxdTwLvECAA?autoplay=1&mute=1&start=80",
    cultural_tags: ["hollywood", "bittersweet", "emotional", "mixed-feelings"],
    semantic_context:
      "Mixed emotions, laughing and crying at the same time. Bittersweet feelings about the sprint — some things went great, others were terrible. Emotional rollercoaster, can't tell if this is a win or a loss. Happy and sad simultaneously, celebrating a launch while mourning the tech debt it created. Comedy and tragedy intertwined, absurd situations that are both hilarious and heartbreaking. Shipped the feature but broke staging, got promoted but inherited legacy code. Pedro Pascal energy, emotional whiplash, laughing through the pain.",
    rlhf_score: 0,
  },
  {
    id: "gopi-bahu-laptop",
    title: "Gopi Bahu Laptop Washing",
    base_rating: 5,
    video_url:
      "https://www.youtube.com/embed/ywgeloPNmxk?autoplay=1&mute=1",
    cultural_tags: ["indian", "tech-fail", "innocent", "destructive"],
    semantic_context:
      "Catastrophic misunderstanding of technology, doing something completely wrong with total innocence. Washing a laptop like it's dishes. Fundamental tech failure, doing the exact opposite of what you should, hilariously wrong approach to a problem. Deleting the production database thinking it was staging, pushing directly to main, running rm -rf on the wrong directory. Innocent but destructive mistakes, well-intentioned disasters, not understanding the basics. Someone did something so wrong it's almost impressive, comically bad tech decisions, accidental sabotage.",
    rlhf_score: 0,
  },
];

// ── Environment validation ────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const geminiKey = requireEnv("GEMINI_API_KEY");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const genAI = new GoogleGenerativeAI(geminiKey);
  const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
  });

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Seeding ${MEMES.length} memes into meme_contexts...\n`);

  for (const meme of MEMES) {
    console.log(`  Embedding: ${meme.title}`);

    const embeddingResult = await embeddingModel.embedContent(
      meme.semantic_context,
    );
    const embedding = embeddingResult.embedding.values.slice(0, 768);

    const { error } = await supabase.from("meme_contexts").insert({
      id: meme.id,
      title: meme.title,
      base_rating: meme.base_rating,
      video_url: meme.video_url,
      cultural_tags: meme.cultural_tags,
      semantic_context: meme.semantic_context,
      rlhf_score: meme.rlhf_score,
      embedding: JSON.stringify(embedding),
    });

    if (error) {
      throw new Error(
        `Failed to insert "${meme.title}": ${error.message}`,
      );
    }

    console.log(`  ✓ Inserted "${meme.title}" (${embedding.length}d vector)\n`);
  }

  console.log("Seed complete.");
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

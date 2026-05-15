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
  // ── Original 5 ──────────────────────────────────────────────────────────────
  {
    id: "pooja_01",
    title: "Pooja, What is this behavior?",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/GPLJVitGsso?autoplay=1&mute=1",
    cultural_tags: ["India", "Reality TV", "Bigg Boss"],
    semantic_context: "Absolute chaos and unacceptable behavior. Use this when someone pushes untested code directly to production, deletes a database table by accident, or does something so reckless that the entire team is left speechless.",
    rlhf_score: 0,
  },
  {
    id: "green_mile_01",
    title: "I'm tired, boss (Green Mile)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/-3_IuPMya6k?autoplay=1&mute=1",
    cultural_tags: ["US", "Classic Film", "Drama"],
    semantic_context: "Deep exhaustion and burnout from relentless work. Use this when a developer has been working overtime for weeks, is completely drained from endless bug fixes, or just wants the sprint to end already.",
    rlhf_score: 0,
  },
  {
    id: "this_is_fine_01",
    title: "This Is Fine (Dog in Fire)",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/0oBx7Jg4m-o?autoplay=1&mute=1",
    cultural_tags: ["Global", "Internet Classic", "Meme"],
    semantic_context: "Denial in the face of disaster. Use this when everything is clearly falling apart — servers are down, deadlines are missed — but the team insists everything is fine during standup.",
    rlhf_score: 0,
  },
  {
    id: "pedro_pascal_01",
    title: "Pedro Pascal Crying then Laughing",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/jxdTwLvECAA?autoplay=1&mute=1&start=80",
    cultural_tags: ["Global", "Celebrity", "Meme"],
    semantic_context: "Emotional whiplash between crying and laughing. Use this when the sprint was a wild rollercoaster — some things went terribly wrong but others turned out unexpectedly amazing.",
    rlhf_score: 0,
  },
  {
    id: "gopi_bahu_01",
    title: "Gopi Bahu Washing Laptop",
    base_rating: 5,
    video_url: "https://www.youtube.com/embed/ywgeloPNmxk?autoplay=1&mute=1",
    cultural_tags: ["India", "TV Drama", "Viral"],
    semantic_context: "Hilariously wrong technical understanding. Use this when someone does something technically absurd with complete confidence, like trying to fix a software bug by restarting hardware, or cleaning a database by literally deleting the files.",
    rlhf_score: 0,
  },
  // ── Expansion Pack 1 ────────────────────────────────────────────────────────
  {
    id: "uday_01",
    title: "Control Uday Control (Welcome)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/7V7zLrlX-T0?autoplay=1&mute=1",
    cultural_tags: ["India", "Bollywood", "Tech Humor"],
    semantic_context: "Desperately trying to hold back extreme anger or frustration. Use this when a developer is holding their tongue after a PM changes the requirements at the last minute, or when forced to remain calm while reviewing absolutely terrible code written by a senior engineer. Restraint in the face of pure stupidity.",
    rlhf_score: 0,
  },
  {
    id: "harold_01",
    title: "Hide the Pain Harold",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/a3WnvDtDD2M?autoplay=1&mute=1&start=5",
    cultural_tags: ["Global", "Tech Classic"],
    semantic_context: "Smiling through extreme internal suffering. Use this when a developer says they are 'fine' but they are actually dealing with undocumented legacy code, impossible deadlines, or putting on a brave face during a grueling client meeting. Suppressed agony disguised as professionalism.",
    rlhf_score: 0,
  },
  {
    id: "parkour_01",
    title: "Michael Scott Parkour",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/0Kvw2BPKjz0?autoplay=1&mute=1",
    cultural_tags: ["US", "The Office", "Global"],
    semantic_context: "Chaotic, poorly executed agility. Use this when the team is jumping frantically between tasks, hacking together a messy workaround, bypassing QA to push directly to production, or doing 'Agile' completely wrong but somehow making it work. Reckless momentum.",
    rlhf_score: 0,
  },
  {
    id: "khaby_01",
    title: "Khaby Lame - The Simple Fix",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/VzmiXHgeLf8?autoplay=1&mute=1&start=3",
    cultural_tags: ["Global", "TikTok", "Common Sense"],
    semantic_context: "Pointing out the glaringly obvious, simple solution to an overcomplicated problem. Use this when someone writes 500 lines of code for something that could be done in 2 lines, or when engineers over-engineer a basic feature with microservices. Common sense prevailing over tech-bro complexity.",
    rlhf_score: 0,
  },
  {
    id: "jal_lijiye_01",
    title: "Aap Thak Gaye Honge (Jal Lijiye)",
    base_rating: 4,
    video_url: "https://giphy.com/embed/xUPGcC0R9QjyxkPnS8",
    cultural_tags: ["India", "Bollywood", "Sarcasm"],
    semantic_context: "Passive-aggressive sympathy and polite destruction. Use this when politely destroying someone in a Pull Request review, or when a teammate has been arguing pointlessly in a Slack thread for hours. Offering fake rest and water to someone who is confidently incorrect.",
    rlhf_score: 0,
  },
  // ── Expansion Pack 2 ────────────────────────────────────────────────────────
  {
    id: "travolta_01",
    title: "Confused John Travolta",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/yS55oeuy-X0?autoplay=1&mute=1&start=3",
    cultural_tags: ["Global", "Pulp Fiction"],
    semantic_context: "Complete disorientation, loss, and confusion. Use this when a developer inherits a legacy codebase with zero documentation, or when someone is looking for a bug but has absolutely no idea where to even start looking.",
    rlhf_score: 0,
  },
  {
    id: "hera_pheri_01",
    title: "25 Din Mein Paisa Double",
    base_rating: 4,
    video_url: "https://giphy.com/embed/h0MTqLyvgG0Ss",
    cultural_tags: ["India", "Bollywood", "Hera Pheri"],
    semantic_context: "Overpromising, scam energy, and selling impossible dreams. Use this when the sales team or project managers promise a ridiculous, massive feature to a client with a totally unrealistic deadline.",
    rlhf_score: 0,
  },
  {
    id: "hackerman_01",
    title: "Hackerman",
    base_rating: 5,
    video_url: "https://www.youtube.com/embed/fQGbXmkSArs?autoplay=1&mute=1&start=5",
    cultural_tags: ["Global", "Kung Fury", "Tech"],
    semantic_context: "Overblown sense of technical superiority. Use this when someone fixes a tiny typo that was breaking the entire build, or writes a basic script and suddenly feels like an absolute cybersecurity god.",
    rlhf_score: 0,
  },
  {
    id: "masaan_01",
    title: "Yeh Dukh Kahe Khatam Nahi Hota",
    base_rating: 1,
    video_url: "https://giphy.com/embed/d2lcHJTG5Tscg",
    cultural_tags: ["India", "Bollywood", "Masaan"],
    semantic_context: "Deep, existential despair over a never-ending problem. Use this when the CI/CD pipeline keeps failing for random reasons, or when closing one Jira ticket spawns five more bugs. Endless suffering.",
    rlhf_score: 0,
  },
  {
    id: "homer_bush_01",
    title: "Homer Simpson Backing Into Bushes",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/jG2KMkQLZmI?autoplay=1&mute=1",
    cultural_tags: ["Global", "The Simpsons"],
    semantic_context: "Quietly avoiding responsibility or pretending you aren't there. Use this when a massive production incident happens, but it is in a different team's microservice, so you just slowly log off Slack.",
    rlhf_score: 0,
  },
  {
    id: "sweating_peele_01",
    title: "Sweating Jordan Peele",
    base_rating: 2,
    video_url: "https://giphy.com/embed/32mC2kXYWCsg0",
    cultural_tags: ["US", "Key and Peele"],
    semantic_context: "Extreme anxiety and high stress. Use this when nervously watching the production deployment logs scroll by, or right after executing a massive database migration and waiting to see if it crashed the system.",
    rlhf_score: 0,
  },
  {
    id: "spiderman_point_01",
    title: "Spider-Man Pointing",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/FKPiqAFt3Rk?autoplay=1&mute=1&start=100",
    cultural_tags: ["Global", "Marvel"],
    semantic_context: "Blaming each other or getting stuck in circular dependencies. Use this when the frontend blames the backend, the backend blames the frontend, or two microservices are stuck in an infinite loop blaming each other.",
    rlhf_score: 0,
  },
  {
    id: "all_is_well_01",
    title: "All is Well",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/7PzwOiW8-n0?autoplay=1&mute=1&start=45",
    cultural_tags: ["India", "Bollywood", "3 Idiots"],
    semantic_context: "Blind faith and comforting yourself when things look bad. Use this when the code is spaghetti, the architecture is a total mess, but the feature somehow works perfectly during the client demo against all odds.",
    rlhf_score: 0,
  },
  {
    id: "elmo_fire_01",
    title: "Hell Elmo",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/VqB1uoDTdKM?autoplay=1&mute=1",
    cultural_tags: ["Global", "Internet Classic"],
    semantic_context: "Embracing total chaos and destruction. Use this when the entire system is crashing, servers are on fire, but the developer has accepted their fate and is just laughing at the absolute state of the application.",
    rlhf_score: 0,
  },
  {
    id: "kehna_kya_01",
    title: "Arey Kehna Kya Chahte Ho?",
    base_rating: 2,
    video_url: "https://giphy.com/embed/ghuvaCOI6GOoTX0RmH",
    cultural_tags: ["India", "Bollywood", "3 Idiots"],
    semantic_context: "Total incomprehension and frustration at a lack of clarity. Use this when reading utterly confusing product requirements, bizarre Slack messages from PMs, or variable names that make absolutely zero sense.",
    rlhf_score: 0,
  },
  {
    id: "escobar_wait_01",
    title: "Pablo Escobar Waiting",
    base_rating: 2,
    video_url: "https://giphy.com/embed/26BRuo6sLetdllPAQ",
    cultural_tags: ["Global", "Narcos"],
    semantic_context: "Boredom, isolation, and emptiness from waiting on external blockers. Use this when a developer is sitting around for hours waiting for a giant Docker image to build, or waiting eternally for a senior engineer to approve their PR.",
    rlhf_score: 0,
  },
  {
    id: "dog_keyboard_01",
    title: "Dog Typing at Keyboard",
    base_rating: 3,
    video_url: "https://giphy.com/embed/9rtpurjbqiqZXbBBet",
    cultural_tags: ["Global", "Internet Classic"],
    semantic_context: "Imposter syndrome and winging it. Use this when forced to use a brand new framework with no experience, or when you copy-paste code from Stack Overflow and it magically works but you have no idea why.",
    rlhf_score: 0,
  },
  {
    id: "mirzapur_betrayal_01",
    title: "Bade Aaram Se Bewakoof Banaya",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/vdVMKJ91q70?autoplay=1&mute=1&start=25",
    cultural_tags: ["India", "Mirzapur", "Web Series"],
    semantic_context: "Feeling betrayed, scammed, or realizing you've been fooled. Use this when third-party API documentation explicitly says one thing, but the actual response is completely different and you wasted three days trying to fix it.",
    rlhf_score: 0,
  },
  {
    id: "kronk_point_01",
    title: "No No, He's Got a Point",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/MZ53pK2Y1ag?autoplay=1&mute=1",
    cultural_tags: ["US", "Disney"],
    semantic_context: "Reluctant agreement or surprising insight. Use this when an intern or junior developer suggests an unconventional, slightly weird solution to a complex problem, but it actually turns out to be the smartest way to do it.",
    rlhf_score: 0,
  },
  {
    id: "apun_bhagwan_01",
    title: "Apun Hi Bhagwan Hai",
    base_rating: 5,
    video_url: "https://giphy.com/embed/8OMbbhiAT3kd4chi33",
    cultural_tags: ["India", "Sacred Games", "God Mode"],
    semantic_context: "Ultimate god-complex and invincibility. Use this when a developer pushes an absolutely massive, critical update directly to production on a Friday evening, and it executes completely flawlessly with zero bugs.",
    rlhf_score: 0,
  },
  // ── User-requested Short (starts ~0:34) ───────────────────────────────────────
  {
    id: "yt_short_4dflvz_01",
    title: 'The Devil Wears Prada — Emily Blunt “hearing this / wanna hear this”',
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/4dFlvzBkBlY?autoplay=1&mute=1&start=34",
    cultural_tags: ["Global", "The Devil Wears Prada", "Meeting Humor", "Emily Blunt"],
    semantic_context:
      "The Devil Wears Prada meme: Emily Blunt deadpan with the glass—'I am hearing this, but I wanna hear this'—polite on the outside, dying inside. Use for the coworker who hijacks standup with a forty-five minute weekend story while everyone else is trapped nodding. One person will not stop talking; nobody can interrupt without seeming rude; the meeting should be five minutes but becomes a hostage situation. PM or teammate monologuing, endless personal tangent, verbal diarrhea in a daily standup, agile ceremony gone wrong, listening fatigue, please wrap it up energy.",
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

    const { error } = await supabase.from("meme_contexts").upsert(
      {
        id: meme.id,
        title: meme.title,
        base_rating: meme.base_rating,
        video_url: meme.video_url,
        cultural_tags: meme.cultural_tags,
        semantic_context: meme.semantic_context,
        rlhf_score: meme.rlhf_score,
        embedding: JSON.stringify(embedding),
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error(
        `Failed to insert "${meme.title}": ${error.message}`,
      );
    }

    console.log(`  ✓ Upserted "${meme.title}" (${embedding.length}d vector)\n`);
  }

  console.log("Seed complete.");
}

main().catch((err: unknown) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

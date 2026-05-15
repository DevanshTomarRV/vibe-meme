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
    video_url: "https://www.youtube.com/embed/GPLJVitGsso?autoplay=1&mute=0",
    cultural_tags: ["India", "Reality TV", "Bigg Boss"],
    semantic_context: "Absolute chaos and unacceptable behavior. Use this when someone pushes untested code directly to production, deletes a database table by accident, or does something so reckless that the entire team is left speechless.",
    rlhf_score: 0,
  },
  {
    id: "green_mile_01",
    title: "I'm tired, boss (Green Mile)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/-3_IuPMya6k?autoplay=1&mute=0",
    cultural_tags: ["US", "Classic Film", "Drama"],
    semantic_context: "Deep exhaustion and burnout from relentless work. Use this when a developer has been working overtime for weeks, is completely drained from endless bug fixes, or just wants the sprint to end already.",
    rlhf_score: 0,
  },
  {
    id: "this_is_fine_01",
    title: "This Is Fine (Dog in Fire)",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/0oBx7Jg4m-o?autoplay=1&mute=0",
    cultural_tags: ["Global", "Internet Classic", "Meme"],
    semantic_context: "Denial in the face of disaster. Use this when everything is clearly falling apart — servers are down, deadlines are missed — but the team insists everything is fine during standup.",
    rlhf_score: 0,
  },
  {
    id: "pedro_pascal_01",
    title: "Pedro Pascal Crying then Laughing",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/jxdTwLvECAA?autoplay=1&mute=0&start=80",
    cultural_tags: ["Global", "Celebrity", "Meme"],
    semantic_context: "Emotional whiplash between crying and laughing. Use this when the sprint was a wild rollercoaster — some things went terribly wrong but others turned out unexpectedly amazing.",
    rlhf_score: 0,
  },
  {
    id: "gopi_bahu_01",
    title: "Gopi Bahu Washing Laptop",
    base_rating: 5,
    video_url: "https://www.youtube.com/embed/ywgeloPNmxk?autoplay=1&mute=0",
    cultural_tags: ["India", "TV Drama", "Viral"],
    semantic_context: "Hilariously wrong technical understanding. Use this when someone does something technically absurd with complete confidence, like trying to fix a software bug by restarting hardware, or cleaning a database by literally deleting the files.",
    rlhf_score: 0,
  },
  // ── Expansion Pack 1 ────────────────────────────────────────────────────────
  {
    id: "uday_01",
    title: "Control Uday Control (Welcome)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/7V7zLrlX-T0?autoplay=1&mute=0",
    cultural_tags: ["India", "Bollywood", "Tech Humor"],
    semantic_context: "Desperately trying to hold back extreme anger or frustration. Use this when a developer is holding their tongue after a PM changes the requirements at the last minute, or when forced to remain calm while reviewing absolutely terrible code written by a senior engineer. Restraint in the face of pure stupidity.",
    rlhf_score: 0,
  },
  {
    id: "harold_01",
    title: "Hide the Pain Harold",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/a3WnvDtDD2M?autoplay=1&mute=0&start=5",
    cultural_tags: ["Global", "Tech Classic"],
    semantic_context: "Smiling through extreme internal suffering. Use this when a developer says they are 'fine' but they are actually dealing with undocumented legacy code, impossible deadlines, or putting on a brave face during a grueling client meeting. Suppressed agony disguised as professionalism.",
    rlhf_score: 0,
  },
  {
    id: "parkour_01",
    title: "Michael Scott Parkour",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/0Kvw2BPKjz0?autoplay=1&mute=0",
    cultural_tags: ["US", "The Office", "Global"],
    semantic_context: "Chaotic, poorly executed agility. Use this when the team is jumping frantically between tasks, hacking together a messy workaround, bypassing QA to push directly to production, or doing 'Agile' completely wrong but somehow making it work. Reckless momentum.",
    rlhf_score: 0,
  },
  {
    id: "khaby_01",
    title: "Khaby Lame - The Simple Fix",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/VzmiXHgeLf8?autoplay=1&mute=0&start=3",
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
    video_url: "https://www.youtube.com/embed/yS55oeuy-X0?autoplay=1&mute=0&start=3",
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
    video_url: "https://www.youtube.com/embed/fQGbXmkSArs?autoplay=1&mute=0&start=5",
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
    video_url: "https://www.youtube.com/embed/jG2KMkQLZmI?autoplay=1&mute=0",
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
    video_url: "https://www.youtube.com/embed/FKPiqAFt3Rk?autoplay=1&mute=0&start=100",
    cultural_tags: ["Global", "Marvel"],
    semantic_context: "Blaming each other or getting stuck in circular dependencies. Use this when the frontend blames the backend, the backend blames the frontend, or two microservices are stuck in an infinite loop blaming each other.",
    rlhf_score: 0,
  },
  {
    id: "all_is_well_01",
    title: "All is Well",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/7PzwOiW8-n0?autoplay=1&mute=0&start=45",
    cultural_tags: ["India", "Bollywood", "3 Idiots"],
    semantic_context: "Blind faith and comforting yourself when things look bad. Use this when the code is spaghetti, the architecture is a total mess, but the feature somehow works perfectly during the client demo against all odds.",
    rlhf_score: 0,
  },
  {
    id: "elmo_fire_01",
    title: "Hell Elmo",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/VqB1uoDTdKM?autoplay=1&mute=0",
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
    video_url: "https://www.youtube.com/embed/vdVMKJ91q70?autoplay=1&mute=0&start=25",
    cultural_tags: ["India", "Mirzapur", "Web Series"],
    semantic_context: "Feeling betrayed, scammed, or realizing you've been fooled. Use this when third-party API documentation explicitly says one thing, but the actual response is completely different and you wasted three days trying to fix it.",
    rlhf_score: 0,
  },
  {
    id: "kronk_point_01",
    title: "No No, He's Got a Point",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/MZ53pK2Y1ag?autoplay=1&mute=0",
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
    video_url: "https://www.youtube.com/embed/4dFlvzBkBlY?autoplay=1&mute=0&start=34",
    cultural_tags: ["Global", "The Devil Wears Prada", "Meeting Humor", "Emily Blunt"],
    semantic_context:
      "The Devil Wears Prada meme: Emily Blunt deadpan with the glass—'I am hearing this, but I wanna hear this'—polite on the outside, dying inside. Use for the coworker who hijacks standup with a forty-five minute weekend story while everyone else is trapped nodding. One person will not stop talking; nobody can interrupt without seeming rude; the meeting should be five minutes but becomes a hostage situation. PM or teammate monologuing, endless personal tangent, verbal diarrhea in a daily standup, agile ceremony gone wrong, listening fatigue, please wrap it up energy.",
    rlhf_score: 0,
  },
  {
    id: "euphoria_maddy_joking_01",
    title: 'Euphoria — Maddy “Bitch, you better be joking”',
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/0DCX5uBnrZM?autoplay=1&mute=0",
    cultural_tags: ["US", "Euphoria", "HBO", "Viral"],
    semantic_context:
      "Maddy Perez from Euphoria: furious disbelief, staring someone down, delivering 'Bitch, you better be joking' energy—this cannot be real. Use when leadership floats an insulting deadline, someone suggests shipping without tests, a PM 'just adds one tiny scope change' that rewrites the sprint, or a teammate says something so absurd you need them to admit they are kidding. Peak you cannot be serious, gaslighting requirements, rage-disbelief, calling out delusion in a retro.",
    rlhf_score: 0,
  },
  {
    id: "dare_run_your_mouth_01",
    title: '“You dare run your mouth” (confrontation meme)',
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/FHp8EFLvZBY?autoplay=1&mute=0",
    cultural_tags: ["Global", "Viral", "Reaction"],
    semantic_context:
      "You dare run your mouth: aggressive confrontational energy—someone had the audacity to talk trash, challenge you, or blame you after you carried the work. Use when a teammate throws shade in Slack, a manager questions your commitment in public, someone second-guessed your estimate after missing every deadline themselves, or retro turns into finger-pointing. Clapback, how dare you speak to me like that, putting them back in their place, calling out disrespect and mouth-running when they should stay humble. Also use when the submitter sounds like they were actually in the wrong but are doubling down, refusing accountability, or flexing too hard—main-character energy, humble-bragging, taking unearned credit, overstating their impact, or bragging so much someone should hand them a mirror; the vibe is 'you really said that out loud?' Also when the vibe check richness score would be rock-bottom: phoned-in one-liner retro, entitled noise, or so little substance it is like they do not deserve the spotlight on this app—wrong energy for the room.",
    rlhf_score: 0,
  },
  {
    id: "ehh_boy_peak_01",
    title: '“Ehh boy” — peak swagger (top of your game)',
    base_rating: 5,
    video_url: "https://www.youtube.com/embed/Acjf66Qdj2U?autoplay=1&mute=0&start=8",
    cultural_tags: ["India", "Viral", "Celebration"],
    semantic_context:
      "Ehh boy meme energy—playful cocky swagger, shoulder-roll confidence, cool-guy strut, 'watch me work' body language. Use when someone self-rates the sprint 5/5 legendary and their story actually backs it up: shipping fire, crushing goals, unstoppable momentum, hero sprint, stacked wins, promotion-worthy arc, flex that feels earned not delusional. Peak engineer on top of their game, main character in the best way, vibes immaculate, team carried on their back, walking off the retro like they own the building.",
    rlhf_score: 0,
  },
  {
    id: "english_medium_01",
    title: "English Medium — ‘very good’ / language police",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/3W1VFVy-C4s?autoplay=1&mute=0",
    cultural_tags: ["India", "Bollywood", "Comedy", "Viral"],
    semantic_context:
      "English Medium meme energy: the teacher or judge reacting to how you speak—patronizing praise, side-eye, or delighted surprise when your English is not what they expected. Use when the sprint write-up is mostly non-English, heavy Hinglish or another language mixed in, transliterated slang, or a bilingual engineer venting in their mother tongue; you may genuinely love it or find it chaotic. Also use when someone is laying on thesaurus English—purple prose, LinkedIn-brain vocabulary, unnecessary jargon, 'synergize leverage paradigm' word salad, or fancy words to sound smarter than the room. Code-switching comedy, language flex both directions, 'shabaash' and judgment in the same breath.",
    rlhf_score: 0,
  },
  {
    id: "kr_child_singing_good_01",
    title: "Korean kid singing — cute / everything’s good",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/57nzztxZGxw?autoplay=1&mute=0",
    cultural_tags: ["Korea", "Viral", "Shorts", "Wholesome"],
    semantic_context:
      "Viral Korean child singing meme: adorable, chaotic-good, heart-melting sincerity—like the whole room is smiling. Use when the user rated the sprint 4 or 5 and the write-up is warm, grateful, or proud in a soft way: small wins stacking, team is cute, vibes sunny, nothing is on fire, shipping felt good, standups were kind. Affectionate 'you're adorable' energy toward the sprint or the engineer—earnest hype without main-character villainy. Random wholesome praise fits; everything is going well, could call them cute and mean it nicely.",
    rlhf_score: 0,
  },
  {
    id: "anupama_marungi_01",
    title: "Anupama — “Main marungi” / lazy-retro rage",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/eAmkg7TbkUc?autoplay=1&mute=0",
    cultural_tags: ["India", "TV", "Anupama", "Viral", "Shorts"],
    semantic_context:
      "Anupama Indian TV meme energy: 'main marungi' / I'll hit you—playful soap-opera matriarch rage when someone phones in a sprint retro with zero depth. Use when the write-up is very bad, lazy, a smug one-liner, insultingly thin, or entitled with no receipts; the vibe is a furious mother scolding a child who did not do the homework. Comedic frustration and anger at engineers who wasted everyone's time, spoon-and-chappal metaphors, 'is this your sprint?' disappointment, shake-you-awake energy. NOT real violence—slapstick TV threat matching an AI bouncer who is done with nonsense. Peer candidate with the uta aitha hungry-meeting lazy meme—either can win on semantic fit for checked-out retros.",
    rlhf_score: 0,
  },
  {
    id: "grammar_spelling_shame_01",
    title: "Grammar / spelling roast (English teacher meltdown)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/s6rTyLNZxPE?autoplay=1&mute=0",
    cultural_tags: ["India", "Viral", "Shorts", "Education"],
    semantic_context:
      "English teacher meltdown energy: too many spelling mistakes, grammar crimes, autocorrect disasters, or chat-slang so thick the retro reads unprofessional. The vibe is 'please improve your English before you waste the standup again'—red-pen disappointment, sighing correction, roast the typos while still caring. Short viral clip shame for sloppy writing; ignore whether they rated the sprint high or low—the issue is language quality.",
    rlhf_score: 0,
  },
  {
    id: "poor_english_shame_mwOH_01",
    title: "Poor English shame — Short (MwOH0gzG4wc)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/MwOH0gzG4wc?autoplay=1&mute=0",
    cultural_tags: ["India", "Viral", "Shorts", "Education"],
    semantic_context:
      "Alternate poor-English roast clip in the same pool as the grammar-teacher meltdown: chronic spelling slips, WhatsApp-English in a retro, or sentences that look like they fell down the stairs. Same job—tell them to level up written English before the next standup—different viral beat. Comedic shame, not bullying.",
    rlhf_score: 0,
  },
  {
    id: "poor_english_shame_otcg_01",
    title: "Poor English shame — Short (OtCgV3UBii4)",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/OtCgV3UBii4?autoplay=1&mute=0",
    cultural_tags: ["India", "Viral", "Shorts", "Education"],
    semantic_context:
      "Poor-English meme variant: sarcastic patience snapping after typos, broken tense, random capitalization, or retro text that reads like autocorrect gave up. Fits the bouncer's poorEnglish lane—same instruction to fix spelling and grammar, swap clip for variety.",
    rlhf_score: 0,
  },
  {
    id: "word_slop_gibberish_rt82_01",
    title: "Word slop / not a language (gibberish retro)",
    base_rating: 1,
    video_url: "https://www.youtube.com/embed/Rt82LroisVA?autoplay=1&mute=0",
    cultural_tags: ["India", "Viral", "Shorts", "Absurdist"],
    semantic_context:
      "When the sprint write-up is not words in any language—keyboard mash, random letters, symbol spam, token salad, or meaningless slop with zero decipherable content. Not bad English; not lazy one-liner; literally un-parseable entropy pretending to be a retro. Baffled 'what did I just read' energy; comedic disbelief that a human hit submit. Fixed meme lane for nonsenseSlop bouncer flag—separate from grammar-shame clips that roast real sentences with typos.",
    rlhf_score: 0,
  },
  {
    id: "uta_aitha_lazy_01",
    title: "Uta aitha? — hungry / meeting-survival lazy retro",
    base_rating: 2,
    video_url: "https://www.youtube.com/embed/LvUIySl7Xi4?autoplay=1&mute=0",
    cultural_tags: ["India", "South India", "Viral", "Shorts", "Food"],
    semantic_context:
      "Uta aitha meme energy—'have you eaten?'—playful callout when someone is clearly running on empty stomach brain during a retro. Lazy one-line sprint recap, checked-out typing, vibes like they are only waiting for the meeting to end so they can sprint to free snacks or lunch. Too hungry to type a real paragraph, meeting survival mode, food coma before the food even arrived. Gentle roast: are you fasting through standup or just here for the catering spreadsheet? Peer candidate with the Anupama marungi lazy-retro rage meme—either can win on semantic fit.",
    rlhf_score: 0,
  },
  {
    id: "mamata_brainrot_rally_01",
    title: "Mamata Banerjee — rally / brainrot (mic chaos)",
    base_rating: 4,
    video_url: "https://www.youtube.com/embed/WbWWO8H2EuI?autoplay=1&mute=0&start=10",
    cultural_tags: ["India", "Politics", "Viral", "Meme"],
    semantic_context:
      "Mamata Banerjee viral rally meme energy: loud mic chaos, campaign-trail absurdism, main-character politician brainrot, crowd hyping chaotic call-and-response that still slaps online. Use when the sprint write-up is pure internet brainrot—unhinged slang, rapid-fire meme stacks, Glue-Twitter logic, or so loud and unserious it feels like a political rally livestream. Also fits when the user self-rated the sprint 4 or 5 and the tone is goofy celebratory shout—victory lap with zero coherence, hype over grammar, manic good vibes, meme-stacked recap that reads like a stump speech after three coffees.",
    rlhf_score: 0,
  },
  {
    id: "brainrot_poster_tzD9_01",
    title: "Brainrot — poster child (Short)",
    base_rating: 3,
    video_url: "https://www.youtube.com/embed/tzD9OxAHtzU?autoplay=1&mute=0",
    cultural_tags: ["Global", "Viral", "Shorts", "Brainrot"],
    semantic_context:
      "Viral Short brainrot energy for sprint retros that read like chronically online sludge: meme dialect, TikTok-caption logic, stacked absurdity that still feels like English but is culturally fried. The bouncer calls them the poster child of 'Brainrot'—peak algorithm-for-brains recap, unserious hype, main-character internet. Match when the recap is that poster-child Brainrot voice; other rally or brainrot memes are separate semantic neighbors.",
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

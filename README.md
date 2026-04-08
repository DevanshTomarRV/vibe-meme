# Meme Jukebox

**A multiplayer sprint retrospective tool where AI judges your vibes and rewards you with semantically matched memes.**

> *Greek Space Opera meets New Age Meme Culture*

## What Is This?

Meme Jukebox turns boring sprint retros into an interactive party game. Team members submit their sprint ratings from their phones, an AI "Bouncer" roasts (or hypes) their responses, and a **vector similarity search** finds the perfect meme based on what they actually wrote — not just their number rating. The admin screen plays the matched meme video live, on the big screen.

### How It Works

**Players** (on their phones/laptops) visit the main page:
1. Enter their name
2. Rate the sprint 1-5 (from Dumpster Fire to Legendary)
3. Write why they chose that rating
4. Hit "Vibe Check" — the AI Bouncer grades their response for "richness" and drops a witty one-liner
5. The API embeds their text, finds the closest meme via pgvector, and saves everything server-side
6. See a "Look at the main screen!" confirmation

**Admin** (on the projected screen) visits `/admin`:
- Sees all submissions in real-time
- Clicks any submission to reveal the explanation, AI comment, and the semantically matched meme video — autoplaying for the whole room

### Semantic Meme Matching

Instead of a static rating-to-meme map, each meme has a rich semantic description that gets embedded into a 768-dimensional vector. When a user submits their explanation, it's embedded the same way and matched against all memes using cosine similarity via Supabase pgvector.

| Vibe | Meme | Matches When You Write About... |
|------|------|---------------------------------|
| Chaos | Pooja, What is this behavior? | Bizarre conduct, dysfunctional meetings, people ignoring all norms |
| Burnout | I'm Tired Boss (Green Mile) | Exhaustion, overwork, sprint fatigue, running on fumes |
| Denial | This Is Fine | Everything on fire but pretending it's okay, ignoring red flags |
| Mixed | Pedro Pascal Laughing Then Crying | Bittersweet wins, emotional rollercoasters, laughing through pain |
| Tech Fail | Gopi Bahu Laptop Washing | Catastrophic mistakes, doing the exact wrong thing innocently |

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — custom glassmorphism, neon glows, starfield background
- **Google Gemini 2.5 Flash** — AI Bouncer that scores responses and generates roasts/hype
- **Gemini Embedding (gemini-embedding-001)** — converts text into 768d vectors for semantic search
- **Supabase + pgvector** — real-time data persistence and vector similarity search for meme matching

## Project Structure

```
src/
├── app/
│   ├── api/evaluate-vibe/route.ts    # AI Bouncer + embedding + vector search + DB insert
│   ├── admin/page.tsx                # Admin Dashboard (big screen)
│   ├── components/
│   │   ├── RatingButton.tsx          # Neon-coded 1-5 buttons
│   │   ├── LoadingState.tsx          # Orbital spinner animation
│   │   └── VibeResult.tsx            # Score + video display
│   ├── globals.css                   # Glassmorphism, neon, starfield
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Player-facing form
├── lib/
│   ├── supabase.ts                   # Supabase client (lazy init)
│   └── videoMap.ts                   # Legacy rating-to-meme-URL mapping
scripts/
└── seed.ts                           # Seed meme_contexts with embeddings
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- A [Supabase](https://supabase.com) project with the pgvector extension enabled

### 1. Clone & Install

```bash
git clone https://github.com/DevanshTomarRV/vibe-meme.git
cd vibe-meme
npm install
```

### 2. Set Up Supabase

Enable the pgvector extension and create the required tables in your Supabase SQL Editor:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Meme context table with embeddings
create table meme_contexts (
  id text primary key,
  title text not null,
  base_rating smallint not null,
  video_url text not null,
  cultural_tags text[] default '{}',
  semantic_context text not null,
  rlhf_score smallint default 0,
  embedding vector(768)
);

-- Submissions table
create table sprint_submissions (
  id uuid default gen_random_uuid() primary key,
  user_name text not null,
  rating int not null,
  explanation text not null,
  richness_score int not null,
  ai_comment text not null,
  meme_url text not null,
  created_at timestamptz default now()
);

-- Similarity search function
create or replace function match_memes (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  title text,
  video_url text,
  semantic_context text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    video_url,
    semantic_context,
    1 - (meme_contexts.embedding <=> query_embedding) as similarity
  from meme_contexts
  where 1 - (meme_contexts.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys:

```
GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Seed the Meme Database

Generate embeddings for all 5 memes and insert them into `meme_contexts`:

```bash
npm run seed
```

### 5. Run

```bash
npm run dev
```

- **Players:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

## Usage (Party Mode)

1. Open `/admin` on the big screen / projector
2. Share `localhost:3000` (or your deployed URL) with the team
3. Everyone submits their sprint vibes from their phones
4. Admin clicks each submission to reveal the AI verdict and play the semantically matched meme
5. Laugh. Reflect. Ship better next sprint.

## License

[MIT](LICENSE)

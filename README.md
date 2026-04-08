# Meme Jukebox

**A multiplayer sprint retrospective tool where AI judges your vibes and rewards you with memes.**

> *Greek Space Opera meets New Age Meme Culture*

## What Is This?

Meme Jukebox turns boring sprint retros into an interactive party game. Team members submit their sprint ratings from their phones, an AI "Bouncer" roasts (or hypes) their responses, and the admin screen plays the perfect meme video for each submission — live, on the big screen.

### How It Works

**Players** (on their phones/laptops) visit the main page:
1. Enter their name
2. Rate the sprint 1-5 (from Dumpster Fire to Legendary)
3. Write why they chose that rating
4. Hit "Vibe Check" — the AI Bouncer grades their response for "richness" and drops a witty one-liner
5. See a "Look at the main screen!" confirmation

**Admin** (on the projected screen) visits `/admin`:
- Sees all submissions in real-time
- Clicks any submission to reveal the explanation, AI comment, and the matching meme video — autoplaying for the whole room

### The Meme Map

| Rating | Vibe | Meme |
|--------|------|------|
| 1 | Dumpster Fire | Pooja, What is this behavior? |
| 2 | Struggling | I'm Tired Boss (Green Mile) |
| 3 | Meh | This Is Fine |
| 4 | Good Times | Pedro Pascal Laughing Then Crying |
| 5 | Legendary | Gopi Bahu Laptop Washing |

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — custom glassmorphism, neon glows, starfield background
- **Google Gemini 2.5 Flash** — AI Bouncer that scores responses and generates roasts/hype
- **Supabase** — real-time data persistence for multiplayer submissions

## Project Structure

```
src/
├── app/
│   ├── api/evaluate-vibe/route.ts    # Gemini-powered AI Bouncer
│   ├── admin/page.tsx                # Admin Dashboard (big screen)
│   ├── components/
│   │   ├── RatingButton.tsx          # Neon-coded 1-5 buttons
│   │   ├── LoadingState.tsx          # Orbital spinner animation
│   │   └── VibeResult.tsx            # Score + video display (Phase 1)
│   ├── globals.css                   # Glassmorphism, neon, starfield
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Player-facing form
├── lib/
│   ├── supabase.ts                   # Supabase client (lazy init)
│   └── videoMap.ts                   # Rating-to-meme-URL mapping
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/DevanshTomarRV/vibe-meme.git
cd vibe-meme
npm install
```

### 2. Set Up Supabase

Create a `sprint_submissions` table in your Supabase SQL Editor:

```sql
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

### 4. Run

```bash
npm run dev
```

- **Players:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

## Usage (Party Mode)

1. Open `/admin` on the big screen / projector
2. Share `localhost:3000` (or your deployed URL) with the team
3. Everyone submits their sprint vibes from their phones
4. Admin clicks each submission to reveal the AI verdict and play the meme
5. Laugh. Reflect. Ship better next sprint.

## License

[MIT](LICENSE)

-- Run this alone in a NEW Supabase SQL Editor tab (do not append to other queries).

create table if not exists meme_feedback (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid not null references sprint_submissions(id) on delete cascade,
  relatable boolean not null,
  relatable_how text,
  created_at timestamptz default now(),
  unique (submission_id)
);

create index if not exists idx_meme_feedback_submission on meme_feedback(submission_id);

alter table meme_feedback enable row level security;

drop policy if exists "Public insert meme feedback" on meme_feedback;
create policy "Public insert meme feedback"
  on meme_feedback for insert
  with check (true);

drop policy if exists "Public read meme feedback" on meme_feedback;
create policy "Public read meme feedback"
  on meme_feedback for select
  using (true);

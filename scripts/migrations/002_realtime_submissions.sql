-- Enable Supabase Realtime for live admin dashboard updates.
-- Run once in the Supabase SQL Editor if new submissions do not appear instantly on /admin.
alter publication supabase_realtime add table sprint_submissions;

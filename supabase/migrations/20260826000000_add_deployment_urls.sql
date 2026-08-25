-- P0-3: Add deployment URL columns missing from projects table
-- These columns exist in TypeScript types but not in the database schema
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS frontend_url TEXT,
  ADD COLUMN IF NOT EXISTS backend_url TEXT,
  ADD COLUMN IF NOT EXISTS supabase_url TEXT;

-- Fix milestone status enum mismatch
-- DB constraint has: 'pending', 'in_progress', 'completed', 'overdue'
-- TypeScript has: 'planned', 'in_progress', 'completed', 'missed'
ALTER TABLE public.milestones
  DROP CONSTRAINT IF EXISTS milestones_status_check;
ALTER TABLE public.milestones
  ADD CONSTRAINT milestones_status_check
  CHECK (status IN ('planned', 'in_progress', 'completed', 'missed'));

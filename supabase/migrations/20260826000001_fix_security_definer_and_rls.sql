-- ============================================================
-- Migration: Fix SECURITY DEFINER search_path & tighten activity_events RLS
-- Date: 2026-08-26
-- Description:
--   1. P1-6: Mitigate function search-path hijacking by setting search_path on functions
--   2. P1-7: Split activity_events RLS policy: users can SELECT their own events,
--      INSERT is restricted to service_role (webhooks) or system triggers.
-- ============================================================

-- 1. Fix SECURITY DEFINER functions search_path (P1-6)
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- Convert handle_updated_at to SECURITY INVOKER
ALTER FUNCTION public.handle_updated_at() SECURITY INVOKER;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;

-- 2. Tighten RLS on activity_events (P1-7)
DROP POLICY IF EXISTS "Users can manage own activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Users can view own activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_events;

-- Users can only read their own audit/activity history
CREATE POLICY "Users can view own activity"
  ON public.activity_events
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Only authenticated user creating an event within their own projects can insert
CREATE POLICY "Users can insert activity in own projects"
  ON public.activity_events
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Migration: Drop redundant and duplicate indexes (P2-5)
-- Date: 2026-08-26
-- Description:
--   Removes redundant indexes whose leading columns are already
--   covered by compound indexes, saving disk and write overhead.
-- ============================================================

-- idx_projects_user_id is covered by idx_projects_user_status (user_id, status)
DROP INDEX IF EXISTS public.idx_projects_user_id;

-- idx_tasks_project_id is covered by idx_tasks_project_id_status (project_id, status)
DROP INDEX IF EXISTS public.idx_tasks_project_id;

-- idx_notifications_user_unread is covered by idx_notifications_user_id (user_id, is_read)
DROP INDEX IF EXISTS public.idx_notifications_user_unread;

-- idx_project_repositories_project_id is covered by idx_project_repos_project_id (project_id)
DROP INDEX IF EXISTS public.idx_project_repositories_project_id;

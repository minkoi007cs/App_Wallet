-- Migration: 20260825000000_phase10_security_indexes.sql
-- Description: Phase 10 Multi-tenant indexes and Security Audit RLS verification

-- 1. Create performance indexes for multi-tenant query isolation
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_health ON public.projects(health_status);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON public.projects(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_repositories_project_id ON public.project_repositories(project_id);
CREATE INDEX IF NOT EXISTS idx_project_integrations_project_id ON public.project_integrations(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON public.task_subtasks(task_id);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_project_id ON public.journal_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_project_id ON public.activity_events(project_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_external_accounts_user_provider ON public.external_accounts(user_id, provider);

-- 2. Security audit: Verify row level security is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

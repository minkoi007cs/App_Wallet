-- ============================================================
-- APP WALLET — PHASE 2 SUPABASE FOUNDATION MIGRATION
-- Database Schema, Functions, RLS Policies & Triggers
-- ============================================================

-- 1. CUSTOM ENUMS
CREATE TYPE public.project_status AS ENUM ('idea', 'active', 'paused', 'completed', 'archived');
CREATE TYPE public.project_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.repo_role AS ENUM ('frontend', 'backend', 'mobile', 'ai', 'other');
CREATE TYPE public.integration_provider AS ENUM ('github', 'vercel', 'supabase');
CREATE TYPE public.integration_status AS ENUM ('detected', 'suggested', 'confirmed', 'disconnected');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE public.health_state AS ENUM ('healthy', 'needs_attention', 'critical');

-- 2. UTILITY FUNCTION: AUTO UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFILES TABLE (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. PROJECTS TABLE
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status public.project_status DEFAULT 'idea' NOT NULL,
    priority public.project_priority DEFAULT 'medium' NOT NULL,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    target_date DATE,
    tags TEXT[] DEFAULT '{}',
    health_status public.health_state DEFAULT 'healthy' NOT NULL,
    health_reasons TEXT[] DEFAULT '{}',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX idx_projects_user_health ON public.projects(user_id, health_status);

CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. PROJECT REPOSITORIES TABLE (Multi-repo per project)
CREATE TABLE public.project_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider public.integration_provider DEFAULT 'github' NOT NULL,
    external_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    role public.repo_role DEFAULT 'other' NOT NULL,
    default_branch TEXT DEFAULT 'main',
    visibility TEXT DEFAULT 'public',
    primary_language TEXT,
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    open_issues_count INT DEFAULT 0,
    latest_commit_sha TEXT,
    latest_commit_message TEXT,
    latest_commit_author TEXT,
    latest_commit_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_project_repo UNIQUE(project_id, provider, external_id)
);

CREATE INDEX idx_project_repos_project_id ON public.project_repositories(project_id);

CREATE TRIGGER set_project_repositories_updated_at
BEFORE UPDATE ON public.project_repositories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. PROJECT INTEGRATIONS TABLE (Vercel & Supabase metadata)
CREATE TABLE public.project_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider public.integration_provider NOT NULL,
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status public.integration_status DEFAULT 'confirmed' NOT NULL,
    production_url TEXT,
    latest_deployment_url TEXT,
    latest_deployment_status TEXT,
    latest_deployment_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_project_integration UNIQUE(project_id, provider, external_id)
);

CREATE INDEX idx_project_integrations_project_id ON public.project_integrations(project_id);

CREATE TRIGGER set_project_integrations_updated_at
BEFORE UPDATE ON public.project_integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. TASKS TABLE
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status DEFAULT 'todo' NOT NULL,
    priority public.project_priority DEFAULT 'medium' NOT NULL,
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tasks_project_id_status ON public.tasks(project_id, status);

CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TASK SUBTASKS TABLE
CREATE TABLE public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_task_subtasks_task_id ON public.task_subtasks(task_id);

-- 9. MILESTONES TABLE
CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_milestones_project_id ON public.milestones(project_id);

CREATE TRIGGER set_milestones_updated_at
BEFORE UPDATE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. JOURNAL ENTRIES TABLE
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_journal_entries_project_id ON public.journal_entries(project_id);

CREATE TRIGGER set_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. ACTIVITY EVENTS TABLE
CREATE TABLE public.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_activity_events_project_id ON public.activity_events(project_id);

-- 12. NOTIFICATIONS & PREFERENCES TABLES
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, is_read);

CREATE TABLE public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    github_activity BOOLEAN DEFAULT true NOT NULL,
    deployment_failures BOOLEAN DEFAULT true NOT NULL,
    new_repositories BOOLEAN DEFAULT true NOT NULL,
    deadlines BOOLEAN DEFAULT true NOT NULL,
    inactive_projects BOOLEAN DEFAULT true NOT NULL,
    ai_insights BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. EXTERNAL ACCOUNTS TABLE (Encrypted OAuth Tokens)
CREATE TABLE public.external_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider public.integration_provider NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_external_account UNIQUE(user_id, provider, account_id)
);

CREATE INDEX idx_external_accounts_user_id ON public.external_accounts(user_id);

CREATE TRIGGER set_external_accounts_updated_at
BEFORE UPDATE ON public.external_accounts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. SYNC STATE TABLE
CREATE TABLE public.sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider public.integration_provider NOT NULL,
    entity_type TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sync_status TEXT DEFAULT 'success' NOT NULL,
    error_message TEXT,
    CONSTRAINT uq_user_sync_state UNIQUE(user_id, provider, entity_type)
);

-- ============================================================
-- 15. AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Developer'),
        NEW.raw_user_meta_data->>'avatar_url'
    );

    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- PROJECTS RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
ON public.projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- PROJECT REPOSITORIES RLS
ALTER TABLE public.project_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage project repositories"
ON public.project_repositories FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_repositories.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_repositories.project_id
        AND p.user_id = auth.uid()
    )
);

-- PROJECT INTEGRATIONS RLS
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage project integrations"
ON public.project_integrations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_integrations.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_integrations.project_id
        AND p.user_id = auth.uid()
    )
);

-- TASKS RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage project tasks"
ON public.tasks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = tasks.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = tasks.project_id
        AND p.user_id = auth.uid()
    )
);

-- TASK SUBTASKS RLS
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage task subtasks"
ON public.task_subtasks FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        WHERE t.id = task_subtasks.task_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.projects p ON p.id = t.project_id
        WHERE t.id = task_subtasks.task_id
        AND p.user_id = auth.uid()
    )
);

-- MILESTONES RLS
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage project milestones"
ON public.milestones FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = milestones.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = milestones.project_id
        AND p.user_id = auth.uid()
    )
);

-- JOURNAL ENTRIES RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage journal entries"
ON public.journal_entries FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = journal_entries.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = journal_entries.project_id
        AND p.user_id = auth.uid()
    )
);

-- ACTIVITY EVENTS RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage activity events"
ON public.activity_events FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = activity_events.project_id
        AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = activity_events.project_id
        AND p.user_id = auth.uid()
    )
);

-- NOTIFICATIONS & PREFERENCES RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notifications"
ON public.notifications FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- EXTERNAL ACCOUNTS RLS
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage external accounts"
ON public.external_accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- SYNC STATE RLS
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sync state"
ON public.sync_state FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

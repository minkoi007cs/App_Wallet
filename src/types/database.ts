export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type RepoRole = 'frontend' | 'backend' | 'mobile' | 'ai' | 'other';
export type IntegrationProvider = 'github' | 'vercel' | 'supabase';
export type IntegrationStatus = 'detected' | 'suggested' | 'confirmed' | 'disconnected';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type HealthState = 'healthy' | 'needs_attention' | 'critical';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          priority: ProjectPriority;
          progress: number;
          start_date: string | null;
          target_date: string | null;
          tags: string[];
          health_status: HealthState;
          health_reasons: string[];
          last_activity_at: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: ProjectPriority;
          progress?: number;
          start_date?: string | null;
          target_date?: string | null;
          tags?: string[];
          health_status?: HealthState;
          health_reasons?: string[];
          last_activity_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: ProjectPriority;
          progress?: number;
          start_date?: string | null;
          target_date?: string | null;
          tags?: string[];
          health_status?: HealthState;
          health_reasons?: string[];
          last_activity_at?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_repositories: {
        Row: {
          id: string;
          project_id: string;
          provider: IntegrationProvider;
          external_id: string;
          owner: string;
          name: string;
          url: string;
          role: RepoRole;
          default_branch: string;
          visibility: string;
          primary_language: string | null;
          stars_count: number;
          forks_count: number;
          open_issues_count: number;
          latest_commit_sha: string | null;
          latest_commit_message: string | null;
          latest_commit_author: string | null;
          latest_commit_date: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          provider?: IntegrationProvider;
          external_id: string;
          owner: string;
          name: string;
          url: string;
          role?: RepoRole;
          default_branch?: string;
          visibility?: string;
          primary_language?: string | null;
          stars_count?: number;
          forks_count?: number;
          open_issues_count?: number;
          latest_commit_sha?: string | null;
          latest_commit_message?: string | null;
          latest_commit_author?: string | null;
          latest_commit_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          provider?: IntegrationProvider;
          external_id?: string;
          owner?: string;
          name?: string;
          url?: string;
          role?: RepoRole;
          default_branch?: string;
          visibility?: string;
          primary_language?: string | null;
          stars_count?: number;
          forks_count?: number;
          open_issues_count?: number;
          latest_commit_sha?: string | null;
          latest_commit_message?: string | null;
          latest_commit_author?: string | null;
          latest_commit_date?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_integrations: {
        Row: {
          id: string;
          project_id: string;
          provider: IntegrationProvider;
          external_id: string;
          name: string;
          status: IntegrationStatus;
          production_url: string | null;
          latest_deployment_url: string | null;
          latest_deployment_status: string | null;
          latest_deployment_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          provider: IntegrationProvider;
          external_id: string;
          name: string;
          status?: IntegrationStatus;
          production_url?: string | null;
          latest_deployment_url?: string | null;
          latest_deployment_status?: string | null;
          latest_deployment_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          provider?: IntegrationProvider;
          external_id?: string;
          name?: string;
          status?: IntegrationStatus;
          production_url?: string | null;
          latest_deployment_url?: string | null;
          latest_deployment_status?: string | null;
          latest_deployment_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: ProjectPriority;
          due_date: string | null;
          tags: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: ProjectPriority;
          due_date?: string | null;
          tags?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: ProjectPriority;
          due_date?: string | null;
          tags?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          status: string;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          status?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_events: {
        Row: {
          id: string;
          project_id: string;
          event_type: string;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          event_type: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          event_type?: string;
          title?: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          is_read: boolean;
          link_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          is_read?: boolean;
          link_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          type?: string;
          is_read?: boolean;
          link_url?: string | null;
          created_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          github_activity: boolean;
          deployment_failures: boolean;
          new_repositories: boolean;
          deadlines: boolean;
          inactive_projects: boolean;
          ai_insights: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          github_activity?: boolean;
          deployment_failures?: boolean;
          new_repositories?: boolean;
          deadlines?: boolean;
          inactive_projects?: boolean;
          ai_insights?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          github_activity?: boolean;
          deployment_failures?: boolean;
          new_repositories?: boolean;
          deadlines?: boolean;
          inactive_projects?: boolean;
          ai_insights?: boolean;
          updated_at?: string;
        };
      };
      external_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: IntegrationProvider;
          account_id: string;
          account_name: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: IntegrationProvider;
          account_id: string;
          account_name?: string | null;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: IntegrationProvider;
          account_id?: string;
          account_name?: string | null;
          access_token_encrypted?: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_state: {
        Row: {
          id: string;
          user_id: string;
          provider: IntegrationProvider;
          entity_type: string;
          last_synced_at: string;
          sync_status: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: IntegrationProvider;
          entity_type: string;
          last_synced_at?: string;
          sync_status?: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: IntegrationProvider;
          entity_type?: string;
          last_synced_at?: string;
          sync_status?: string;
          error_message?: string | null;
        };
      };
    };
  };
}

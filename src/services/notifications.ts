import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { fetchProjects } from '@/services/projects';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationPreferenceRow = Database['public']['Tables']['notification_preferences']['Row'];

export interface NotificationPreferenceUpdates {
  github_activity?: boolean;
  deployment_failures?: boolean;
  new_repositories?: boolean;
  deadlines?: boolean;
  inactive_projects?: boolean;
  ai_insights?: boolean;
}

// ──────────────── HELPERS ────────────────

async function requireAuth(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated. Please sign in.');
  return userId;
}

// ──────────────── NOTIFICATIONS CRUD ────────────────

export async function fetchNotifications(): Promise<{
  notifications: NotificationRow[];
  unreadCount: number;
}> {
  await requireAuth();

  const { data, error } = await (supabase.from('notifications') as any)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const list = (data || []) as NotificationRow[];
  const unreadCount = list.filter((n) => !n.is_read).length;
  return { notifications: list, unreadCount };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await requireAuth();

  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await requireAuth();

  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

// ──────────────── PREFERENCES ────────────────

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceRow> {
  const userId = await requireAuth();

  const { data, error } = await (supabase.from('notification_preferences') as any)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as NotificationPreferenceRow;
}

export async function updateNotificationPreferences(
  updates: NotificationPreferenceUpdates
): Promise<NotificationPreferenceRow> {
  const userId = await requireAuth();

  const { data, error } = await (supabase.from('notification_preferences') as any)
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferenceRow;
}

// ──────────────── AUTO-GENERATE (server-side in future) ────────────────

export async function generateAutomaticNotifications(): Promise<void> {
  const userId = await requireAuth();
  const projects = await fetchProjects();

  for (const p of projects) {
    if (p.health_status === 'critical') {
      const { error } = await (supabase.from('notifications') as any).insert({
        user_id: userId,
        title: `🚨 Critical Alert: ${p.name}`,
        body: p.health_reasons?.[0] || 'Project health is critical.',
        type: 'deadlines',
        is_read: false,
        link_url: `/project/${p.id}`,
      });
      if (error) console.warn('Failed to insert notification:', error);
    }
  }
}

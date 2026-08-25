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

// Fallback initial dataset for preview / offline mode
let localNotificationsStore: NotificationRow[] = [
  {
    id: 'notif-1',
    user_id: 'dev-user',
    title: '⚠️ Overdue Tasks Alert',
    body: 'Subject Manager has 2 tasks overdue.',
    type: 'deadlines',
    is_read: false,
    link_url: '/project/demo-2',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'dev-user',
    title: '🚀 GitHub Commit Recorded',
    body: 'Commit a8f7c9e pushed to minkoi007cs/App_Wallet',
    type: 'github_activity',
    is_read: false,
    link_url: '/project/demo-3',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    user_id: 'dev-user',
    title: '✅ Vercel Deployment Successful',
    body: 'ai-study-assistant-web deployed to production (READY)',
    type: 'deployment_failures',
    is_read: true,
    link_url: '/project/demo-1',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

let localPreferencesStore: NotificationPreferenceRow = {
  user_id: 'dev-user',
  github_activity: true,
  deployment_failures: true,
  new_repositories: true,
  deadlines: true,
  inactive_projects: true,
  ai_insights: true,
  updated_at: new Date().toISOString(),
};

export async function fetchNotifications(): Promise<{
  notifications: NotificationRow[];
  unreadCount: number;
}> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('notifications') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const list = data as NotificationRow[];
        const unreadCount = list.filter((n) => !n.is_read).length;
        return { notifications: list, unreadCount };
      }
    }
  } catch (err) {
    console.warn('fetchNotifications notice:', err);
  }

  const unreadCount = localNotificationsStore.filter((n) => !n.is_read).length;
  return { notifications: localNotificationsStore, unreadCount };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await (supabase.from('notifications') as any)
        .update({ is_read: true })
        .eq('id', id);
    }
  } catch (err) {
    console.warn('markNotificationAsRead notice:', err);
  }

  const idx = localNotificationsStore.findIndex((n) => n.id === id);
  if (idx !== -1) {
    localNotificationsStore[idx].is_read = true;
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await (supabase.from('notifications') as any)
        .update({ is_read: true })
        .eq('is_read', false);
    }
  } catch (err) {
    console.warn('markAllNotificationsAsRead notice:', err);
  }

  localNotificationsStore = localNotificationsStore.map((n) => ({ ...n, is_read: true }));
}

export async function deleteNotification(id: string): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase.from('notifications').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('deleteNotification notice:', err);
  }

  localNotificationsStore = localNotificationsStore.filter((n) => n.id !== id);
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferenceRow> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const { data, error } = await (supabase.from('notification_preferences') as any)
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (!error && data) {
        return data as NotificationPreferenceRow;
      }
    }
  } catch (err) {
    console.warn('fetchNotificationPreferences notice:', err);
  }

  return localPreferencesStore;
}

export async function updateNotificationPreferences(
  updates: NotificationPreferenceUpdates
): Promise<NotificationPreferenceRow> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      const userId = session.session.user.id;
      const { data, error } = await (supabase.from('notification_preferences') as any)
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        return data as NotificationPreferenceRow;
      }
    }
  } catch (err) {
    console.warn('updateNotificationPreferences notice:', err);
  }

  localPreferencesStore = {
    ...localPreferencesStore,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return localPreferencesStore;
}

export async function generateAutomaticNotifications(): Promise<void> {
  const projects = await fetchProjects();
  const newNotifs: NotificationRow[] = [];

  projects.forEach((p) => {
    if (p.health_status === 'critical') {
      newNotifs.push({
        id: `gen-${Date.now()}-${p.id}`,
        user_id: 'dev-user',
        title: `🚨 Critical Alert: ${p.name}`,
        body: p.health_reasons?.[0] || 'Project health is critical.',
        type: 'deadlines',
        is_read: false,
        link_url: `/project/${p.id}`,
        created_at: new Date().toISOString(),
      });
    }
  });

  if (newNotifs.length > 0) {
    localNotificationsStore = [...newNotifs, ...localNotificationsStore];
  }
}

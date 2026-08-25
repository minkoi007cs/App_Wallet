import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPreferenceUpdates } from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';

export function NotificationPreferencesCard() {
  const { colors } = useTheme();
  const { preferences, updatePreferences } = useNotifications();

  const handleToggle = (key: keyof NotificationPreferenceUpdates, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const prefList: {
    key: keyof NotificationPreferenceUpdates;
    label: string;
    description: string;
    icon: string;
  }[] = [
    {
      key: 'deadlines',
      label: 'Deadline & Overdue Alerts',
      description: 'Notify when target dates approach or tasks become overdue',
      icon: 'alert-circle-outline',
    },
    {
      key: 'deployment_failures',
      label: 'Deployment Failure Alerts',
      description: 'Notify immediately when a Vercel build fails',
      icon: 'rocket-outline',
    },
    {
      key: 'github_activity',
      label: 'GitHub Activity Stream',
      description: 'Notify on new commits, pull requests & branch pushes',
      icon: 'logo-github',
    },
    {
      key: 'inactive_projects',
      label: 'Inactive Project Warnings',
      description: 'Alert when active projects have no commits for 14+ days',
      icon: 'time-outline',
    },
    {
      key: 'ai_insights',
      label: 'AI Health Insights',
      description: 'Receive automated recommendations from Project Health Engine',
      icon: 'sparkles-outline',
    },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={20} color={colors.brand} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Notification Preferences
        </Text>
      </View>

      <View style={styles.list}>
        {prefList.map((item) => {
          const isEnabled = preferences ? (preferences as any)[item.key] ?? true : true;
          return (
            <View key={item.key} style={styles.row}>
              <View style={styles.iconCol}>
                <Ionicons name={item.icon as any} size={18} color={colors.textSecondary} />
              </View>

              <View style={styles.textCol}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>

              <Switch
                value={isEnabled}
                onValueChange={(val) => handleToggle(item.key, val)}
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor="#FFFFFF"
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  list: {
    gap: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconCol: {
    width: 24,
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: 14,
  },
});

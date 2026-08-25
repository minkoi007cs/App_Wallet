import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationRow } from '@/services/notifications';

type FilterTab = 'all' | 'unread';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    reload,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredNotifications =
    activeTab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'deadlines':
        return <Ionicons name="alert-circle-outline" size={20} color={colors.statusCritical} />;
      case 'github_activity':
        return <Ionicons name="logo-github" size={20} color={colors.brand} />;
      case 'deployment_failures':
        return <Ionicons name="rocket-outline" size={20} color={colors.statusWarning} />;
      case 'inactive_projects':
        return <Ionicons name="time-outline" size={20} color={colors.textMuted} />;
      default:
        return <Ionicons name="notifications-outline" size={20} color={colors.accent} />;
    }
  };

  const handleCardPress = async (item: NotificationRow) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    if (item.link_url) {
      router.push(item.link_url as any);
    }
  };

  return (
    <Container padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Notification Center"
          subtitle={`${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`}
          action={
            unreadCount > 0 ? (
              <Button
                title="Mark All Read"
                onPress={markAllRead}
                variant="ghost"
                size="sm"
              />
            ) : undefined
          }
        />

        {/* Filter tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[
              styles.tabPill,
              {
                backgroundColor: activeTab === 'all' ? colors.textPrimary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'all' ? colors.background : colors.textSecondary },
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('unread')}
            style={[
              styles.tabPill,
              {
                backgroundColor: activeTab === 'unread' ? colors.textPrimary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'unread' ? colors.background : colors.textSecondary },
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={100} borderRadius={Radius.lg} />
            <Skeleton height={100} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filteredNotifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'unread'
                ? 'No unread notifications 🎉'
                : 'No notifications recorded yet.'}
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {filteredNotifications.map((item) => (
              <Card
                key={item.id}
                style={[
                  styles.card,
                  !item.is_read && { borderColor: colors.brand, borderWidth: 1 },
                ]}
                onPress={() => handleCardPress(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    {getNotifIcon(item.type)}
                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                  </View>
                  {!item.is_read && <Badge label="NEW" variant="brand" size="sm" />}
                </View>

                <Text style={[styles.itemBody, { color: colors.textSecondary }]}>
                  {item.body}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.itemTime, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>

                  <View style={styles.actionRow}>
                    {!item.is_read && (
                      <Button
                        title="Mark Read"
                        onPress={() => markAsRead(item.id)}
                        variant="ghost"
                        size="sm"
                      />
                    )}
                    <Button
                      title="Clear"
                      onPress={() => deleteNotification(item.id)}
                      variant="danger"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  tabPill: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  skeletonBlock: {
    gap: Spacing[3],
  },
  list: {
    gap: Spacing[3],
  },
  card: {
    padding: Spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
    marginRight: Spacing[2],
  },
  itemTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  itemBody: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
    marginBottom: Spacing[3],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  emptyCard: {
    padding: Spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
  },
});

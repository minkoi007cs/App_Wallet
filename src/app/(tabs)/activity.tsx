import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useActivityStream } from '@/hooks/useGitHub';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { activities, loading, error, reload } = useActivityStream();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'github_commit':
        return <Ionicons name="git-commit-outline" size={18} color={colors.brand} />;
      case 'github_pr':
        return <Ionicons name="git-pull-request-outline" size={18} color={colors.statusWarning} />;
      case 'deployment':
        return <Ionicons name="rocket-outline" size={18} color={colors.accent} />;
      default:
        return <Ionicons name="notifications-outline" size={18} color={colors.statusHealthy} />;
    }
  };

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Activity Stream"
          subtitle="Real-time timeline of GitHub commits, PRs & deploys"
        />

        {loading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={90} borderRadius={Radius.lg} />
            <Skeleton height={90} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : activities.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No activity recorded yet. Connect a GitHub repository to stream activity!
            </Text>
          </Card>
        ) : (
          <View style={styles.activityList}>
            {activities.map((item) => (
              <Card key={item.id} style={styles.activityCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    {getEventIcon(item.event_type)}
                    <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {item.description && (
                  <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Badge
                    label={item.event_type.replace('_', ' ').toUpperCase()}
                    variant="neutral"
                    size="sm"
                  />
                  {(item.metadata as any)?.author && (
                    <Text style={[styles.authorText, { color: colors.textMuted }]}>
                      by {(item.metadata as any).author}
                    </Text>
                  )}
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
  skeletonBlock: {
    gap: Spacing[3],
  },
  activityList: {
    gap: Spacing[3],
  },
  activityCard: {
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
  eventTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  eventTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  eventDesc: {
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
  authorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
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

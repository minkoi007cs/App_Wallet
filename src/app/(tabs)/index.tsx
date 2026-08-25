import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useProjects } from '@/hooks/useProjects';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StatusDistributionCard } from '@/components/analytics/StatusDistributionCard';
import { TechStackCard } from '@/components/analytics/TechStackCard';
import { UpcomingDeadlinesCard } from '@/components/analytics/UpcomingDeadlinesCard';
import { SmartRecommendationsCard } from '@/components/ai/SmartRecommendationsCard';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { projects, stats, loading, error, reload } = useProjects();
  const { analytics } = useAnalytics();

  const activeProjects = projects.filter((p) => p.status === 'active');
  const needsAttentionProjects = projects.filter((p) => p.health_status !== 'healthy');

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge label="Healthy" variant="healthy" dot size="sm" />;
      case 'needs_attention':
      case 'warning':
        return <Badge label="Needs Attention" variant="warning" dot size="sm" />;
      case 'critical':
        return <Badge label="Critical" variant="critical" dot size="sm" />;
      default:
        return <Badge label="Healthy" variant="healthy" dot size="sm" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 18) return 'Good afternoon 🌤️';
    return 'Good evening 🌙';
  };

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="App Wallet"
          subtitle={`${getGreeting()} — Developer Command Center`}
          action={
            <Button
              title="+ Add Project"
              onPress={() => router.push('/project/add')}
              variant="primary"
              size="sm"
            />
          }
        />

        {/* Project Statistics Bar */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusHealthy }]}>{stats.active}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusWarning }]}>{stats.paused}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paused</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.textMuted }]}>{stats.ideas}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ideas</Text>
          </Card>
        </View>

        {loading ? (
          <View style={{ gap: 12, marginTop: 16 }}>
            <Skeleton height={140} borderRadius={Radius.lg} />
            <Skeleton height={140} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            {/* Analytics Summary Charts */}
            {analytics && (
              <View style={styles.analyticsSection}>
                <StatusDistributionCard
                  averageProgress={analytics.averageProgress}
                  statusBreakdown={analytics.statusBreakdown}
                />

                <TechStackCard techStack={analytics.topTechStack} />

                {analytics.upcomingDeadlines.length > 0 && (
                  <UpcomingDeadlinesCard deadlines={analytics.upcomingDeadlines} />
                )}
              </View>
            )}

            {/* Smart "What should I work on next?" Recommendation */}
            <SmartRecommendationsCard />

            {/* Today's Focus Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flame-outline" size={18} color={colors.statusWarning} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Today&apos;s Focus
                </Text>
              </View>

              {activeProjects.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No active projects right now. Click &quot;+ Add Project&quot; to begin!
                  </Text>
                </Card>
              ) : (
                activeProjects.map((proj) => (
                  <Card
                    key={proj.id}
                    style={styles.projectCard}
                    onPress={() => router.push(`/project/${proj.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                          {proj.name}
                        </Text>
                        {getHealthBadge(proj.health_status)}
                      </View>
                      <Text style={[styles.projectDesc, { color: colors.textSecondary }]}>
                        {proj.description || 'No description.'}
                      </Text>
                    </View>

                    <View style={styles.progressRow}>
                      <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                        Progress: {proj.progress}%
                      </Text>
                      <ProgressBar progress={proj.progress} color={colors.statusHealthy} height={6} />
                    </View>

                    {proj.tags && proj.tags.length > 0 && (
                      <View style={styles.techPills}>
                        {proj.tags.map((tag) => (
                          <Badge key={tag} label={tag} variant="neutral" size="sm" />
                        ))}
                      </View>
                    )}
                  </Card>
                ))
              )}
            </View>

            {/* Needs Attention Alert Section */}
            {needsAttentionProjects.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning-outline" size={18} color={colors.statusCritical} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Needs Attention
                  </Text>
                </View>

                {needsAttentionProjects.map((proj) => (
                  <Card
                    key={proj.id}
                    variant="subtle"
                    style={styles.alertCard}
                    onPress={() => router.push(`/project/${proj.id}`)}
                  >
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertProjectName, { color: colors.textPrimary }]}>
                        {proj.name}
                      </Text>
                      {getHealthBadge(proj.health_status)}
                    </View>
                    {proj.health_reasons?.map((reason, idx) => (
                      <Text key={idx} style={[styles.alertReason, { color: colors.statusCritical }]}>
                        • {reason}
                      </Text>
                    ))}
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginVertical: Spacing[4],
  },
  statCard: {
    flex: 1,
    padding: Spacing[3],
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  analyticsSection: {
    marginTop: Spacing[2],
  },
  section: {
    marginTop: Spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  projectCard: {
    marginBottom: Spacing[3],
  },
  cardHeader: {
    marginBottom: Spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  projectName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  projectDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
  },
  progressRow: {
    marginBottom: Spacing[3],
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 4,
  },
  techPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  alertCard: {
    marginBottom: Spacing[3],
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  alertProjectName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  alertReason: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  emptyCard: {
    padding: Spacing[6],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
  },
});

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useProjectDetail } from '@/hooks/useProjects';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type SubTab = 'overview' | 'repositories' | 'integrations';

export default function ProjectDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { project, loading, error, reload } = useProjectDetail(id as string);
  const [activeTab, setActiveTab] = useState<SubTab>('overview');

  if (loading) {
    return (
      <Container padded>
        <Header title="Project Detail" />
        <Skeleton height={180} borderRadius={Radius.lg} style={{ marginBottom: 16 }} />
        <Skeleton height={120} borderRadius={Radius.lg} />
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container padded>
        <Header title="Project Detail" />
        <ErrorState
          message={error || 'Project not found.'}
          onRetry={reload}
        />
      </Container>
    );
  }

  const getStatusBadge = (status: string) => {
    const variant: BadgeVariant =
      status === 'active'
        ? 'brand'
        : status === 'completed'
        ? 'healthy'
        : status === 'paused'
        ? 'warning'
        : 'neutral';
    return <Badge label={status.toUpperCase()} variant={variant} size="md" />;
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge label="Healthy" variant="healthy" dot size="md" />;
      case 'needs_attention':
      case 'warning':
        return <Badge label="Needs Attention" variant="warning" dot size="md" />;
      case 'critical':
        return <Badge label="Critical" variant="critical" dot size="md" />;
      default:
        return <Badge label="Healthy" variant="healthy" dot size="md" />;
    }
  };

  return (
    <Container padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title={project.name}
          subtitle={`Updated ${new Date(project.last_activity_at).toLocaleDateString()}`}
          action={
            <Button
              title="Edit"
              onPress={() => router.push(`/project/edit/${project.id}`)}
              variant="outline"
              size="sm"
              icon={<Ionicons name="create-outline" size={16} color={colors.textPrimary} />}
            />
          }
        />

        {/* Status & Health Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.badgesRow}>
            {getStatusBadge(project.status)}
            {getHealthBadge(project.health_status)}
            <Badge label={`${project.priority.toUpperCase()} PRIORITY`} variant="neutral" size="md" />
          </View>

          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {project.description || 'No description provided.'}
          </Text>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                Overall Progress
              </Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                {project.progress}% Complete
              </Text>
            </View>
            <ProgressBar progress={project.progress} height={8} />
          </View>

          {/* Tech Stack Pills */}
          {project.tags && project.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {project.tags.map((tag) => (
                <Badge key={tag} label={tag} variant="neutral" size="sm" />
              ))}
            </View>
          )}
        </Card>

        {/* Sub-tab Navigation */}
        <View style={styles.subTabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[
              styles.subTab,
              activeTab === 'overview' && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'overview' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('repositories')}
            style={[
              styles.subTab,
              activeTab === 'repositories' && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'repositories' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              Repositories ({project.repositories?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('integrations')}
            style={[
              styles.subTab,
              activeTab === 'integrations' && { borderBottomColor: colors.brand, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === 'integrations' ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              Integrations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Health Reasons Card */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pulse-outline" size={18} color={colors.brand} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Project Health Diagnostics
                </Text>
              </View>
              {project.health_reasons && project.health_reasons.length > 0 ? (
                project.health_reasons.map((reason, index) => (
                  <Text key={index} style={[styles.reasonItem, { color: colors.textSecondary }]}>
                    • {reason}
                  </Text>
                ))
              ) : (
                <Text style={[styles.reasonItem, { color: colors.statusHealthy }]}>
                  ✓ Project health status is verified optimal.
                </Text>
              )}
            </Card>

            {/* Timeline & Metadata Card */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.brand} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Project Dates
                </Text>
              </View>
              <View style={styles.datesGrid}>
                <View style={styles.dateCell}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Start Date</Text>
                  <Text style={[styles.dateVal, { color: colors.textPrimary }]}>
                    {project.start_date || 'Not set'}
                  </Text>
                </View>
                <View style={styles.dateCell}>
                  <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Target Date</Text>
                  <Text style={[styles.dateVal, { color: colors.textPrimary }]}>
                    {project.target_date || 'Not set'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'repositories' && (
          <View style={styles.tabContent}>
            {project.repositories && project.repositories.length > 0 ? (
              project.repositories.map((repo) => (
                <Card key={repo.id} style={styles.repoCard}>
                  <View style={styles.repoHeader}>
                    <View style={styles.repoTitleRow}>
                      <Ionicons name="logo-github" size={20} color={colors.textPrimary} />
                      <Text style={[styles.repoName, { color: colors.textPrimary }]}>
                        {repo.owner}/{repo.name}
                      </Text>
                    </View>
                    <Badge label={repo.role.toUpperCase()} variant="brand" size="sm" />
                  </View>

                  <View style={styles.repoStatsRow}>
                    <Text style={[styles.repoStat, { color: colors.textSecondary }]}>
                      ⭐ {repo.stars_count} stars
                    </Text>
                    <Text style={[styles.repoStat, { color: colors.textSecondary }]}>
                      🍴 {repo.forks_count} forks
                    </Text>
                    <Text style={[styles.repoStat, { color: colors.textSecondary }]}>
                      🚨 {repo.open_issues_count} issues
                    </Text>
                  </View>

                  {repo.latest_commit_message && (
                    <View style={styles.commitBox}>
                      <Text style={[styles.commitMsg, { color: colors.textPrimary }]}>
                        Latest Commit: {repo.latest_commit_message}
                      </Text>
                      <Text style={[styles.commitAuthor, { color: colors.textMuted }]}>
                        by {repo.latest_commit_author || 'GitHub'} on branch {repo.default_branch}
                      </Text>
                    </View>
                  )}

                  <Button
                    title="Open on GitHub"
                    onPress={() => Linking.openURL(repo.url)}
                    variant="outline"
                    size="sm"
                    style={styles.openBtn}
                  />
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No GitHub repositories linked to this project yet.
                </Text>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'integrations' && (
          <View style={styles.tabContent}>
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="triangle-outline" size={20} color={colors.textPrimary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Vercel Deployment
                </Text>
              </View>
              <Text style={[styles.reasonItem, { color: colors.textSecondary }]}>
                Status: Not connected yet (Phase 7 Integration)
              </Text>
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flash-outline" size={20} color={colors.statusHealthy} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Supabase Database
                </Text>
              </View>
              <Text style={[styles.reasonItem, { color: colors.textSecondary }]}>
                Project Ref: ymunwzjmemxifjxsiugz
              </Text>
            </Card>
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
  headerCard: {
    marginBottom: Spacing[4],
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.sm,
    marginBottom: Spacing[4],
  },
  progressSection: {
    marginBottom: Spacing[3],
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  metaValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  subTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A40',
    marginBottom: Spacing[4],
  },
  subTab: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  subTabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  tabContent: {
    gap: Spacing[3],
  },
  sectionCard: {
    padding: Spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  reasonItem: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
    marginBottom: 4,
  },
  datesGrid: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  dateCell: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  dateVal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  repoCard: {
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  repoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  repoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  repoName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  repoStatsRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  repoStat: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  commitBox: {
    backgroundColor: '#18181B50',
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginBottom: Spacing[3],
  },
  commitMsg: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.sans,
  },
  commitAuthor: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  openBtn: {
    alignSelf: 'flex-start',
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

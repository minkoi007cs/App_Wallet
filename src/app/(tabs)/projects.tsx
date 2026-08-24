import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/TextInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useProjects } from '@/hooks/useProjects';
import { ProjectStatus } from '@/types/database';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FILTER_TABS = ['All', 'Active', 'Paused', 'Completed', 'Idea'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<FilterTab>('All');

  const statusFilter: ProjectStatus | 'all' =
    selectedTab === 'All' ? 'all' : (selectedTab.toLowerCase() as ProjectStatus);

  const { projects, loading, error, reload } = useProjects({
    searchQuery,
    status: statusFilter,
  });

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

  const getStatusBadge = (status: string) => {
    const variant: BadgeVariant =
      status === 'active'
        ? 'brand'
        : status === 'completed'
        ? 'healthy'
        : status === 'paused'
        ? 'warning'
        : 'neutral';
    return <Badge label={status.toUpperCase()} variant={variant} size="sm" />;
  };

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Projects"
          subtitle={`${projects.length} projects in your ecosystem`}
          action={
            <Button
              title="+ New"
              onPress={() => router.push('/project/add')}
              variant="primary"
              size="sm"
            />
          }
        />

        {/* Search Input */}
        <TextInput
          placeholder="Search by project name, tech stack, tag..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {FILTER_TABS.map((tab) => {
                const isActive = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setSelectedTab(tab)}
                    style={[
                      styles.tabPill,
                      {
                        backgroundColor: isActive
                          ? colors.textPrimary
                          : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: isActive
                            ? colors.background
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Projects List */}
        {loading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={140} borderRadius={Radius.lg} />
            <Skeleton height={140} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <View style={styles.projectsList}>
            {projects.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No projects match your filter criteria.
                </Text>
              </Card>
            ) : (
              projects.map((proj) => {
                const reposCount = proj.repositories?.length || 0;
                return (
                  <Card
                    key={proj.id}
                    style={styles.projectCard}
                    onPress={() => router.push(`/project/${proj.id}`)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.headerTop}>
                        <View style={styles.badgesRow}>
                          {getStatusBadge(proj.status)}
                          {getHealthBadge(proj.health_status)}
                        </View>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>
                          {new Date(proj.last_activity_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                        {proj.name}
                      </Text>
                      <Text
                        style={[styles.projectDesc, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {proj.description || 'No description provided.'}
                      </Text>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabelRow}>
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          Progress
                        </Text>
                        <Text style={[styles.metaText, { color: colors.textPrimary }]}>
                          {proj.progress}%
                        </Text>
                      </View>
                      <ProgressBar progress={proj.progress} height={5} />
                    </View>

                    {/* Footer Tech Tags */}
                    <View style={styles.cardFooter}>
                      <View style={styles.tagsRow}>
                        {proj.tags.map((tag) => (
                          <Badge key={tag} label={tag} variant="neutral" size="sm" />
                        ))}
                      </View>
                      <View style={styles.repoCountRow}>
                        <Ionicons name="git-branch-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.repoCountText, { color: colors.textMuted }]}>
                          {reposCount} {reposCount === 1 ? 'repo' : 'repos'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
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
  tabsContainer: {
    marginBottom: Spacing[4],
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
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
  projectsList: {
    gap: Spacing[3],
  },
  projectCard: {
    padding: Spacing[4],
  },
  cardHeader: {
    marginBottom: Spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  projectName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
  },
  progressSection: {
    marginBottom: Spacing[3],
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: '#27272A20',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1],
    flex: 1,
  },
  repoCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacing[2],
  },
  repoCountText: {
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

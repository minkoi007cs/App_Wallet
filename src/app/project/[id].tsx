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
import { useProjectRepositories } from '@/hooks/useGitHub';
import { useVercelIntegrations } from '@/hooks/useVercel';
import { LinkRepositoryModal } from '@/components/modals/LinkRepositoryModal';
import { LinkVercelModal } from '@/components/modals/LinkVercelModal';
import { HealthDiagnosticCard } from '@/components/health/HealthDiagnosticCard';
import { AIAgentPromptModal } from '@/components/modals/AIAgentPromptModal';
import { checkSupabaseHealth, SupabaseHealthResult, getSupabaseDashboardUrl } from '@/services/supabaseStatus';
import { autoDetectAndSaveProjectUrls, resetProjectDeploymentUrls } from '@/services/urlDetector';
import { showToast } from '@/components/ui/Toast';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type SubTab = 'overview' | 'repositories' | 'integrations';

const QUICK_ACTIONS = [
  { label: 'Tasks', icon: 'checkmark-circle-outline' as const, route: (id: string) => `/project/tasks/${id}`, color: '#6366F1' },
  { label: 'Milestones', icon: 'flag-outline' as const, route: (id: string) => `/project/milestones/${id}`, color: '#F59E0B' },
  { label: 'Journal', icon: 'journal-outline' as const, route: (id: string) => `/project/journal/${id}`, color: '#10B981' },
] as const;

export default function ProjectDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id as string;
  const { project, loading, error, reload } = useProjectDetail(projectId);
  const { repositories, availableRepos, linkRepository, unlinkRepository } = useProjectRepositories(projectId);
  const { integrations, availableProjects, linkVercelProject, unlinkVercelProject } = useVercelIntegrations(projectId);

  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showVercelModal, setShowVercelModal] = useState(false);
  const [showAIPromptModal, setShowAIPromptModal] = useState(false);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [resettingUrls, setResettingUrls] = useState(false);

  const checkDbHealth = React.useCallback(async () => {
    if (!project?.supabase_url) {
      setSupabaseHealth(null);
      return;
    }
    setCheckingDb(true);
    try {
      const result = await checkSupabaseHealth(project.supabase_url);
      setSupabaseHealth(result);
    } finally {
      setCheckingDb(false);
    }
  }, [project?.supabase_url]);

  React.useEffect(() => {
    let isMounted = true;
    if (project?.supabase_url) {
      checkSupabaseHealth(project.supabase_url).then((result) => {
        if (isMounted) {
          setSupabaseHealth(result);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [project?.supabase_url]);

  const handleAutoDetectUrls = async () => {
    setAutoDetecting(true);
    try {
      await autoDetectAndSaveProjectUrls(projectId);
      await reload();
      showToast({
        type: 'success',
        title: 'URLs Synchronized',
        message: 'Deployment & Supabase URLs auto-detected and updated!',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Auto-detect Failed',
        message: err.message || 'Could not auto-detect URLs.',
      });
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleResetUrls = async () => {
    setResettingUrls(true);
    try {
      await resetProjectDeploymentUrls(projectId);
      await reload();
      setSupabaseHealth(null);
      showToast({
        type: 'info',
        title: 'URLs Reset',
        message: 'Cleared all deployment & Supabase URLs for this project.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Could not reset URLs.',
      });
    } finally {
      setResettingUrls(false);
    }
  };

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

  const displayRepos = repositories.length > 0 ? repositories : (project.repositories || []);
  const vercelIntegrations = integrations.filter((i) => i.provider === 'vercel');

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
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="AI Prompt"
                onPress={() => setShowAIPromptModal(true)}
                variant="primary"
                size="sm"
                icon={<Ionicons name="sparkles-outline" size={14} color="#fff" />}
              />
              <Button
                title="Edit"
                onPress={() => router.push(`/project/edit/${project.id}`)}
                variant="outline"
                size="sm"
                icon={<Ionicons name="create-outline" size={16} color={colors.textPrimary} />}
              />
            </View>
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
              Repositories ({displayRepos.length})
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
              Integrations ({vercelIntegrations.length + 1})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Quick Actions — Tasks / Milestones / Journal */}
            <View style={styles.quickActionsRow}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.quickActionCard, { backgroundColor: action.color + '18', borderColor: action.color + '40' }]}
                  onPress={() => router.push(action.route(project.id) as any)}
                >
                  <Ionicons name={action.icon} size={22} color={action.color} />
                  <Text style={[styles.quickActionLabel, { color: action.color }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Health Diagnostic Card */}
            <HealthDiagnosticCard
              projectId={project.id}
              initialHealthStatus={project.health_status}
              initialHealthReasons={project.health_reasons || []}
              onRefreshFinished={reload}
            />

            {/* Deployment & Service Links Card */}
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="link-outline" size={18} color={colors.brand} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Deployment & Service Links
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Button
                    title={autoDetecting ? 'Detecting...' : 'Auto-Detect'}
                    onPress={handleAutoDetectUrls}
                    loading={autoDetecting}
                    variant="outline"
                    size="sm"
                  />
                  <Button
                    title={resettingUrls ? 'Resetting...' : 'Reset URLs'}
                    onPress={handleResetUrls}
                    loading={resettingUrls}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              </View>

              <View style={styles.linksGrid}>
                {/* Frontend Vercel Link */}
                <View style={styles.linkRow}>
                  <Ionicons name="globe-outline" size={18} color={colors.statusHealthy} />
                  <View style={styles.linkTextCol}>
                    <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                      Frontend Vercel URL
                    </Text>
                    <Text style={[styles.linkSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {project.frontend_url || 'Not configured'}
                    </Text>
                  </View>
                  {project.frontend_url ? (
                    <Button
                      title="Launch"
                      onPress={() => Linking.openURL(project.frontend_url!)}
                      variant="primary"
                      size="sm"
                    />
                  ) : (
                    <Badge label="UNSET" variant="neutral" size="sm" />
                  )}
                </View>

                {/* Backend Vercel / API Link */}
                <View style={styles.linkRow}>
                  <Ionicons name="server-outline" size={18} color={colors.accent} />
                  <View style={styles.linkTextCol}>
                    <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                      Backend Vercel / API URL
                    </Text>
                    <Text style={[styles.linkSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {project.backend_url || 'Not configured'}
                    </Text>
                  </View>
                  {project.backend_url ? (
                    <Button
                      title="Launch"
                      onPress={() => Linking.openURL(project.backend_url!)}
                      variant="outline"
                      size="sm"
                    />
                  ) : (
                    <Badge label="UNSET" variant="neutral" size="sm" />
                  )}
                </View>

                {/* Supabase Dashboard / DB Link */}
                <View style={styles.linkRow}>
                  <Ionicons name="flash-outline" size={18} color={colors.brand} />
                  <View style={styles.linkTextCol}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>
                        Supabase Cloud DB
                      </Text>
                      {project.supabase_url && (
                        <Badge
                          label={
                            checkingDb
                              ? 'CHECKING...'
                              : supabaseHealth?.status === 'active'
                              ? `ACTIVE (${supabaseHealth.latencyMs || 0}ms)`
                              : supabaseHealth?.status === 'paused'
                              ? 'PAUSED'
                              : 'UNREACHABLE'
                          }
                          variant={
                            checkingDb
                              ? 'neutral'
                              : supabaseHealth?.status === 'active'
                              ? 'healthy'
                              : supabaseHealth?.status === 'paused'
                              ? 'critical'
                              : 'warning'
                          }
                          size="sm"
                        />
                      )}
                    </View>
                    <Text style={[styles.linkSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {project.supabase_url || 'Not configured'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {project.supabase_url && (
                      <TouchableOpacity
                        onPress={checkDbHealth}
                        style={{ padding: 6, justifyContent: 'center' }}
                      >
                        <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                    {project.supabase_url ? (
                      <Button
                        title="Console"
                        onPress={() =>
                          Linking.openURL(
                            supabaseHealth?.dashboardUrl ||
                              getSupabaseDashboardUrl(project.supabase_url) ||
                              project.supabase_url!
                          )
                        }
                        variant={supabaseHealth?.status === 'paused' ? 'primary' : 'ghost'}
                        size="sm"
                      />
                    ) : (
                      <Badge label="UNSET" variant="neutral" size="sm" />
                    )}
                  </View>
                </View>

                {/* Supabase Pause Alert Banner if paused */}
                {supabaseHealth?.status === 'paused' && (
                  <View
                    style={{
                      backgroundColor: colors.statusCritical + '15',
                      borderColor: colors.statusCritical + '40',
                      borderWidth: 1,
                      borderRadius: Radius.md,
                      padding: Spacing[3],
                      marginTop: Spacing[2],
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Ionicons name="warning-outline" size={20} color={colors.statusCritical} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.statusCritical, fontWeight: '700', fontSize: 13 }}>
                        Database is PAUSED (Free-tier Inactivity)
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                        Free tier Supabase projects pause after 7 days without queries. Click &apos;Console&apos; to unpause.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
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
            <Button
              title="+ Link GitHub Repository"
              onPress={() => setShowLinkModal(true)}
              variant="primary"
              size="sm"
              style={styles.linkRepoBtn}
            />

            {displayRepos.length > 0 ? (
              displayRepos.map((repo) => (
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

                  <View style={styles.repoActionRow}>
                    <Button
                      title="Open on GitHub"
                      onPress={() => Linking.openURL(repo.url)}
                      variant="outline"
                      size="sm"
                    />
                    <Button
                      title="Unlink"
                      onPress={() => unlinkRepository(repo.id)}
                      variant="danger"
                      size="sm"
                    />
                  </View>
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
            <Button
              title="+ Link Vercel Project"
              onPress={() => setShowVercelModal(true)}
              variant="primary"
              size="sm"
              style={styles.linkRepoBtn}
            />

            {/* Vercel Integrations List */}
            {vercelIntegrations.map((ver) => (
              <Card key={ver.id} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="triangle-outline" size={20} color={colors.textPrimary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Vercel: {ver.name}
                  </Text>
                  <Badge
                    label={ver.latest_deployment_status || 'READY'}
                    variant={ver.latest_deployment_status === 'ERROR' ? 'critical' : 'healthy'}
                    size="sm"
                  />
                </View>

                {ver.production_url && (
                  <Text style={[styles.reasonItem, { color: colors.textSecondary }]}>
                    URL: {ver.production_url}
                  </Text>
                )}
                {ver.latest_deployment_at && (
                  <Text style={[styles.reasonItem, { color: colors.textMuted }]}>
                    Latest Deploy: {new Date(ver.latest_deployment_at).toLocaleString()}
                  </Text>
                )}

                <View style={[styles.repoActionRow, { marginTop: 12 }]}>
                  {ver.production_url && (
                    <Button
                      title="Open Live Deployment"
                      onPress={() => Linking.openURL(ver.production_url!)}
                      variant="outline"
                      size="sm"
                    />
                  )}
                  <Button
                    title="Unlink"
                    onPress={() => unlinkVercelProject(ver.id)}
                    variant="danger"
                    size="sm"
                  />
                </View>
              </Card>
            ))}

            {/* Supabase Integration Card */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flash-outline" size={20} color={colors.statusHealthy} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Supabase Database
                </Text>
                <Badge label="CONNECTED" variant="healthy" size="sm" />
              </View>
              <Text style={[styles.reasonItem, { color: colors.textSecondary }]}>
                Project Ref: ymunwzjmemxifjxsiugz
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      <LinkRepositoryModal
        visible={showLinkModal}
        projectId={projectId}
        availableRepos={availableRepos}
        onClose={() => setShowLinkModal(false)}
        onLink={linkRepository}
      />

      <LinkVercelModal
        visible={showVercelModal}
        projectId={projectId}
        availableProjects={availableProjects}
        onClose={() => setShowVercelModal(false)}
        onLink={linkVercelProject}
      />

      <AIAgentPromptModal
        visible={showAIPromptModal}
        projectId={projectId}
        projectName={project.name}
        onClose={() => setShowAIPromptModal(false)}
      />
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
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[1],
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing[2],
  },
  quickActionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  sectionCard: {
    padding: Spacing[4],
  },
  linksGrid: {
    gap: Spacing[3],
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: 2,
  },
  linkTextCol: {
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  linkSubText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
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
    flex: 1,
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
  linkRepoBtn: {
    marginBottom: Spacing[3],
    alignSelf: 'flex-start',
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
  repoActionRow: {
    flexDirection: 'row',
    gap: Spacing[2],
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

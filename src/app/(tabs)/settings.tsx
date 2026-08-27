import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useGitHubAccount } from '@/hooks/useGitHub';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth';
import { configureGitHubCredentials, getGitHubConfig, importAllGitHubReposAsProjects } from '@/services/github';
import { configureVercelCredentials, getVercelConfig, getVercelConnectionStatus, fetchAvailableVercelProjects } from '@/services/vercel';
import {
  getSupabaseAccounts,
  addOrUpdateSupabaseAccount,
  addManualSupabaseProject,
  removeSupabaseAccount,
  syncAllSupabaseAccounts,
  SupabaseAccount,
} from '@/services/supabaseAccounts';
import { resetAllProjectsDeploymentUrls } from '@/services/urlDetector';
import { NotificationPreferencesCard } from '@/components/notifications/NotificationPreferencesCard';
import { showToast } from '@/components/ui/Toast';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isConnected, refresh } = useGitHubAccount();

  const initialConfig = getGitHubConfig();
  const initialVercelConfig = getVercelConfig();

  const [username, setUsername] = useState(initialConfig.username || 'minkoi007cs');
  const [patToken, setPatToken] = useState(initialConfig.token || '');
  const [vercelToken, setVercelToken] = useState(initialVercelConfig.token || '');
  const [vercelConnected, setVercelConnected] = useState(false);
  const [vercelUsername, setVercelUsername] = useState<string | undefined>();

  // Multi-account Supabase state
  const [supabaseAccounts, setSupabaseAccounts] = useState<SupabaseAccount[]>(() => getSupabaseAccounts());
  const [showAddSbForm, setShowAddSbForm] = useState(false);
  const [sbAccountEmail, setSbAccountEmail] = useState('');
  const [sbAccountToken, setSbAccountToken] = useState('');
  const [sbManualRef, setSbManualRef] = useState('');
  const [sbProjectName, setSbProjectName] = useState('');
  const [addingSbAccount, setAddingSbAccount] = useState(false);
  const [syncingSbAccounts, setSyncingSbAccounts] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncingVercel, setSyncingVercel] = useState(false);

  React.useEffect(() => {
    let isMounted = true;

    getVercelConnectionStatus().then((res) => {
      if (isMounted) {
        setVercelConnected(res.isConnected);
        setVercelUsername(res.username);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncAllSbAccounts = async () => {
    setSyncingSbAccounts(true);
    try {
      const res = await syncAllSupabaseAccounts();
      setSupabaseAccounts([...getSupabaseAccounts()]);
      showToast({
        type: 'success',
        title: 'Supabase Accounts Synced',
        message: `Synced ${res.totalAccounts} accounts (${res.totalProjects} databases verified)!`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not sync Supabase accounts.',
      });
    } finally {
      setSyncingSbAccounts(false);
    }
  };

  const handleAddSbAccount = async () => {
    if (!sbAccountEmail.trim()) {
      showToast({
        type: 'info',
        title: 'Email Required',
        message: 'Please enter a Gmail/Account label for this Supabase account.',
      });
      return;
    }

    setAddingSbAccount(true);
    try {
      if (sbAccountToken.trim()) {
        await addOrUpdateSupabaseAccount(sbAccountEmail.trim(), sbAccountToken.trim());
        showToast({
          type: 'success',
          title: 'Account Added',
          message: `Connected Supabase account ${sbAccountEmail.trim()} and fetched projects!`,
        });
      } else if (sbManualRef.trim()) {
        addManualSupabaseProject(sbAccountEmail.trim(), sbProjectName.trim(), sbManualRef.trim());
        showToast({
          type: 'success',
          title: 'Database Registered',
          message: `Registered database ${sbManualRef.trim()} under ${sbAccountEmail.trim()}!`,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Token or Project Ref Required',
          message: 'Please enter a Personal Access Token (sbp_...) or a Project Ref.',
        });
        return;
      }

      setSupabaseAccounts([...getSupabaseAccounts()]);
      setSbAccountEmail('');
      setSbAccountToken('');
      setSbManualRef('');
      setSbProjectName('');
      setShowAddSbForm(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Could Not Add Account',
        message: err.message || 'Check your token or project ref.',
      });
    } finally {
      setAddingSbAccount(false);
    }
  };

  const handleRemoveAccount = (id: string) => {
    removeSupabaseAccount(id);
    setSupabaseAccounts([...getSupabaseAccounts()]);
    showToast({
      type: 'info',
      title: 'Account Removed',
      message: 'Removed Supabase account from App Wallet.',
    });
  };

  const handleSaveSync = async () => {
    setSyncing(true);
    try {
      await configureGitHubCredentials({
        username: username.trim(),
        token: patToken.trim() || undefined,
      });
      await refresh();
      showToast({
        type: 'success',
        title: 'GitHub Synced',
        message: `Account @${username.trim()} synchronized successfully!`,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveVercelSync = async () => {
    setSyncingVercel(true);
    try {
      await configureVercelCredentials({
        token: vercelToken.trim() || undefined,
      });
      const status = await getVercelConnectionStatus();
      setVercelConnected(status.isConnected);
      setVercelUsername(status.username);

      const projects = await fetchAvailableVercelProjects();
      showToast({
        type: 'success',
        title: 'Vercel Synced',
        message: `Connected to Vercel (${projects.length} deployments found)!`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Vercel Sync Failed',
        message: err.message || 'Could not connect to Vercel API.',
      });
    } finally {
      setSyncingVercel(false);
    }
  };

  const handleAutoImport = async () => {
    setImporting(true);
    try {
      await configureGitHubCredentials({
        username: username.trim(),
        token: patToken.trim() || undefined,
      });
      const count = await importAllGitHubReposAsProjects();
      showToast({
        type: 'success',
        title: 'Import Complete',
        message: `Successfully imported ${count} repositories into App Wallet!`,
      });
      router.push('/projects');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Import Failed',
        message: err.message || 'Could not import repositories.',
      });
    } finally {
      setImporting(false);
    }
  };

  const [resettingAll, setResettingAll] = useState(false);

  const handleResetAllUrls = async () => {
    setResettingAll(true);
    try {
      const count = await resetAllProjectsDeploymentUrls();
      showToast({
        type: 'info',
        title: 'All URLs Reset',
        message: `Cleared deployment & Supabase URLs on ${count} projects.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Could not reset project URLs.',
      });
    } finally {
      setResettingAll(false);
    }
  };

  const handleConnectGitHubOAuth = () => {
    const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId || clientId === 'demo_client_id') {
      showToast({
        type: 'info',
        title: 'Opening GitHub Tokens',
        message: 'Opening GitHub token creation page in browser...',
      });
      Linking.openURL('https://github.com/settings/tokens/new?description=AppWallet&scopes=public_repo,read:user');
      return;
    }
    const redirectUri = encodeURIComponent('https://ymunwzjmemxifjxsiugz.supabase.co/functions/v1/github-oauth');
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=public_repo,read:user`;
    Linking.openURL(githubAuthUrl);
  };

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Settings & Integrations"
          subtitle="Manage external integrations, account & preferences"
        />

        {/* User Account Profile */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={28} color={colors.brand} />
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {user?.email || 'Developer Account'}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {user?.email ? 'Authenticated user session' : 'App Wallet User'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title="Account & Security"
              onPress={() => router.push('/profile')}
              variant="primary"
              size="sm"
            />
            <Button
              title="Sign Out"
              onPress={() => signOut()}
              variant="outline"
              size="sm"
            />
          </View>
        </Card>

        {/* Supabase Multi-Account Manager Card (TOP INTEGRATION) */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={24} color={colors.brand} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Supabase Multi-Account Manager
                </Text>
                <Badge
                  label={`${supabaseAccounts.length} ACCOUNTS / ${supabaseAccounts.reduce((acc, a) => acc + a.projects.length, 0)} DBS`}
                  variant="healthy"
                  size="sm"
                />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Connect multiple Gmail accounts to bypass the 2-project free limit & monitor live database health
              </Text>
            </View>
          </View>

          {/* Account Lists */}
          <View style={{ gap: 12, marginBottom: 16 }}>
            {supabaseAccounts.map((account) => (
              <View
                key={account.id}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: Radius.lg,
                  padding: Spacing[3],
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="mail-outline" size={16} color={colors.brand} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                      {account.emailLabel}
                    </Text>
                    <Badge label={`${account.projects.length}/2 Projects`} variant="neutral" size="sm" />
                  </View>
                  {account.id !== 'acc_primary' && (
                    <TouchableOpacity onPress={() => handleRemoveAccount(account.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.statusCritical} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Databases under this account */}
                <View style={{ gap: 6 }}>
                  {account.projects.map((proj) => (
                    <View
                      key={proj.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: colors.surface,
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[2],
                        borderRadius: Radius.md,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
                            {proj.name}
                          </Text>
                          <Badge
                            label={proj.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE'}
                            variant={proj.status === 'PAUSED' ? 'critical' : 'healthy'}
                            size="sm"
                          />
                        </View>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                          {proj.id} • {proj.region}
                        </Text>
                      </View>

                      <Button
                        title={proj.status === 'PAUSED' ? 'Unpause' : 'Console'}
                        onPress={() => Linking.openURL(proj.dashboardUrl)}
                        variant={proj.status === 'PAUSED' ? 'primary' : 'ghost'}
                        size="sm"
                      />
                    </View>
                  ))}
                  {account.projects.length === 0 && (
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontStyle: 'italic' }}>
                      No projects found under this account yet.
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Add Account Inline Form */}
          {showAddSbForm ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.brand + '40',
                borderWidth: 1,
                borderRadius: Radius.lg,
                padding: Spacing[4],
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
                Add Another Supabase Account (Gmail / Workspace)
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Account Email / Label *</Text>
              <RNTextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={sbAccountEmail}
                onChangeText={setSbAccountEmail}
                placeholder="e.g. account2@gmail.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                Option A: Supabase Personal Access Token (PAT) - Auto-fetches all projects
              </Text>
              <RNTextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={sbAccountToken}
                onChangeText={setSbAccountToken}
                placeholder="sbp_xxxxxxxxxxxx (from supabase.com/dashboard/account/tokens)"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                Option B: Or Manually Add Project Ref / URL
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <RNTextInput
                  style={[styles.input, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={sbProjectName}
                  onChangeText={setSbProjectName}
                  placeholder="Project Name (e.g. House Renting)"
                  placeholderTextColor={colors.textMuted}
                />
                <RNTextInput
                  style={[styles.input, { flex: 1, color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={sbManualRef}
                  onChangeText={setSbManualRef}
                  placeholder="Ref (e.g. lnuijfoohwvunatwuqjx)"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button
                  title={addingSbAccount ? 'Connecting...' : 'Add Account'}
                  onPress={handleAddSbAccount}
                  loading={addingSbAccount}
                  variant="primary"
                  size="sm"
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowAddSbForm(false)}
                  variant="outline"
                  size="sm"
                />
                <Button
                  title="Create Token"
                  onPress={() => Linking.openURL('https://supabase.com/dashboard/account/tokens')}
                  variant="ghost"
                  size="sm"
                />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title="+ Add Supabase Account / Database"
                onPress={() => setShowAddSbForm(true)}
                variant="primary"
                size="sm"
              />
              <Button
                title={syncingSbAccounts ? 'Syncing...' : 'Sync All Databases'}
                onPress={handleSyncAllSbAccounts}
                loading={syncingSbAccounts}
                variant="outline"
                size="sm"
              />
            </View>
          )}
        </Card>

        {/* Real GitHub Integration Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="logo-github" size={24} color={colors.textPrimary} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Live GitHub Data Connection
                </Text>
                <Badge
                  label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  variant={isConnected ? 'healthy' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Connect your real GitHub account to fetch live repositories & commits
              </Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GitHub Username *</Text>
          <RNTextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. minkoi007cs"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Personal Access Token (PAT - Optional for private repos)</Text>
          <RNTextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={patToken}
            onChangeText={setPatToken}
            placeholder="ghp_xxxxxxxxxxxx (Optional)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <Button
              title={syncing ? 'Syncing...' : 'Sync GitHub Repos'}
              onPress={handleSaveSync}
              loading={syncing}
              variant="primary"
              size="sm"
            />
            <Button
              title={importing ? 'Importing All...' : 'Auto-Import All Repos'}
              onPress={handleAutoImport}
              loading={importing}
              variant="outline"
              size="sm"
            />
          </View>

          <View style={styles.scopesBox}>
            <Text style={[styles.scopesTitle, { color: colors.textPrimary }]}>
              OAuth Web Flow
            </Text>
            <Text style={[styles.scopesText, { color: colors.textSecondary }]}>
              Or connect via secret-isolated Deno Edge Function (`github-oauth`).
            </Text>
            <Button
              title="Connect via GitHub OAuth"
              onPress={handleConnectGitHubOAuth}
              variant="ghost"
              size="sm"
              style={{ marginTop: 6, alignSelf: 'flex-start' }}
            />
          </View>
        </Card>

        {/* Vercel Integration */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="triangle-outline" size={24} color={colors.textPrimary} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Vercel Cloud Integration
                </Text>
                <Badge
                  label={vercelConnected ? `CONNECTED (${vercelUsername || 'Vercel'})` : 'DISCONNECTED'}
                  variant={vercelConnected ? 'healthy' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Connect Vercel API to automatically detect real production & preview URLs
              </Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vercel Personal Access Token</Text>
          <RNTextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={vercelToken}
            onChangeText={setVercelToken}
            placeholder="Enter Vercel Token (from vercel.com/account/tokens)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <Button
              title={syncingVercel ? 'Connecting...' : 'Sync Vercel Projects'}
              onPress={handleSaveVercelSync}
              loading={syncingVercel}
              variant="primary"
              size="sm"
            />
            <Button
              title="Create Vercel Token"
              onPress={() => Linking.openURL('https://vercel.com/account/tokens')}
              variant="ghost"
              size="sm"
            />
          </View>
        </Card>

        {/* Notification Preferences Section */}
        <NotificationPreferencesCard />

        {/* URL Cleanup & Maintenance */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="trash-outline" size={24} color={colors.statusCritical} />
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Project URLs Reset & Cleanup
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Clear all auto-detected or incorrect frontend, backend & Supabase URLs across all projects
              </Text>
            </View>
          </View>

          <Button
            title={resettingAll ? 'Resetting All...' : 'Reset All Project URLs to Blank'}
            onPress={handleResetAllUrls}
            loading={resettingAll}
            variant="outline"
            size="sm"
            style={{ alignSelf: 'flex-start' }}
          />
        </Card>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  sectionCard: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  headerTitleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 4,
    marginTop: Spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginVertical: Spacing[3],
  },
  scopesBox: {
    backgroundColor: '#18181B50',
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginTop: Spacing[2],
  },
  scopesTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 2,
  },
  scopesText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: 15,
  },
});

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, TextInput as RNTextInput } from 'react-native';
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
import { checkSupabaseHealth, SupabaseHealthResult } from '@/services/supabaseStatus';
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
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealthResult | null>(null);

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

    checkSupabaseHealth('https://ymunwzjmemxifjxsiugz.supabase.co').then((res) => {
      if (isMounted) {
        setSupabaseHealth(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* Notification Preferences Section */}
        <NotificationPreferencesCard />

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

        {/* Supabase Database integration info */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={24} color={colors.brand} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Supabase Backend & Cloud DB
                </Text>
                <Badge
                  label={
                    supabaseHealth?.status === 'active'
                      ? `ACTIVE (${supabaseHealth.latencyMs || 0}ms)`
                      : supabaseHealth?.status === 'paused'
                      ? 'PAUSED'
                      : 'ONLINE'
                  }
                  variant={
                    supabaseHealth?.status === 'active'
                      ? 'healthy'
                      : supabaseHealth?.status === 'paused'
                      ? 'critical'
                      : 'healthy'
                  }
                  size="sm"
                />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Connected to project `ymunwzjmemxifjxsiugz` (aws-0-us-west-2)
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Button
              title="Open Supabase Console"
              onPress={() => Linking.openURL('https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz')}
              variant="outline"
              size="sm"
            />
            <Button
              title="API Keys & Settings"
              onPress={() => Linking.openURL('https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz/settings/api')}
              variant="ghost"
              size="sm"
            />
          </View>
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

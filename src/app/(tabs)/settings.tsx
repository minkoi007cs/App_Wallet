import React from 'react';
import { ScrollView, View, Text, StyleSheet, Linking } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isConnected, accountName } = useGitHubAccount();

  const handleConnectGitHub = () => {
    // Opens GitHub OAuth authorization flow
    const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || 'demo_client_id';
    const redirectUri = encodeURIComponent('https://ymunwzjmemxifjxsiugz.supabase.co/functions/v1/github-oauth');
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
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

          <Button
            title="Sign Out"
            onPress={() => signOut()}
            variant="outline"
            size="sm"
            style={styles.actionBtn}
          />
        </Card>

        {/* GitHub Integration */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="logo-github" size={24} color={colors.textPrimary} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  GitHub Integration
                </Text>
                {isConnected ? (
                  <Badge label="CONNECTED" variant="healthy" size="sm" />
                ) : (
                  <Badge label="DISCONNECTED" variant="neutral" size="sm" />
                )}
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {isConnected
                  ? `Connected as @${accountName} (repo, user scopes)`
                  : 'Connect GitHub to import & sync repositories'}
              </Text>
            </View>
          </View>

          <View style={styles.scopesBox}>
            <Text style={[styles.scopesTitle, { color: colors.textPrimary }]}>
              OAuth Edge Function Model
            </Text>
            <Text style={[styles.scopesText, { color: colors.textSecondary }]}>
              Tokens are securely exchanged via secret-isolated Supabase Edge Function (`github-oauth`). Client apps never touch client secret.
            </Text>
          </View>

          <Button
            title={isConnected ? 'Reconnect GitHub' : 'Connect GitHub Account'}
            onPress={handleConnectGitHub}
            variant={isConnected ? 'outline' : 'primary'}
            size="sm"
            style={styles.actionBtn}
          />
        </Card>

        {/* Vercel Integration placeholder */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="triangle-outline" size={24} color={colors.textPrimary} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Vercel Integration
                </Text>
                <Badge label="PHASE 7" variant="neutral" size="sm" />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Deployments & domain URL synchronization
              </Text>
            </View>
          </View>
        </Card>

        {/* Supabase Database integration info */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash-outline" size={24} color={colors.statusHealthy} />
            <View style={styles.headerTitleBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Supabase Backend
                </Text>
                <Badge label="CONNECTED" variant="healthy" size="sm" />
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Ref: ymunwzjmemxifjxsiugz (aws-0-us-west-2)
              </Text>
            </View>
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
  scopesBox: {
    backgroundColor: '#18181B50',
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginBottom: Spacing[3],
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
  actionBtn: {
    alignSelf: 'flex-start',
  },
});

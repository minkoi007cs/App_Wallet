import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Settings"
          subtitle="User account, integrations & system preferences"
        />

        {/* User Profile Card */}
        <Card style={styles.sectionCard}>
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.brand + '20', borderColor: colors.brand },
              ]}
            >
              <Ionicons name="person-outline" size={24} color={colors.brand} />
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                Developer User
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                dev@appwallet.internal
              </Text>
            </View>
            <Badge label="Local Session" variant="neutral" size="sm" />
          </View>
        </Card>

        {/* Integrations Hub */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            External Integrations
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Connect privileged accounts server-side via Supabase Edge Functions.
          </Text>

          <Card style={styles.integrationCard}>
            <View style={styles.integrationRow}>
              <View style={styles.integrationInfo}>
                <Ionicons name="logo-github" size={22} color={colors.textPrimary} />
                <View style={styles.integrationText}>
                  <Text style={[styles.integrationName, { color: colors.textPrimary }]}>
                    GitHub
                  </Text>
                  <Text style={[styles.integrationDesc, { color: colors.textSecondary }]}>
                    Sync repositories, stars, commits & open issues.
                  </Text>
                </View>
              </View>
              <Button
                title="Connect"
                onPress={() => {}}
                variant="outline"
                size="sm"
              />
            </View>
          </Card>

          <Card style={styles.integrationCard}>
            <View style={styles.integrationRow}>
              <View style={styles.integrationInfo}>
                <Ionicons name="triangle-outline" size={22} color={colors.textPrimary} />
                <View style={styles.integrationText}>
                  <Text style={[styles.integrationName, { color: colors.textPrimary }]}>
                    Vercel
                  </Text>
                  <Text style={[styles.integrationDesc, { color: colors.textSecondary }]}>
                    Sync deployment status, production URLs & build logs.
                  </Text>
                </View>
              </View>
              <Button
                title="Connect"
                onPress={() => {}}
                variant="outline"
                size="sm"
              />
            </View>
          </Card>

          <Card style={styles.integrationCard}>
            <View style={styles.integrationRow}>
              <View style={styles.integrationInfo}>
                <Ionicons name="flash-outline" size={22} color={colors.statusHealthy} />
                <View style={styles.integrationText}>
                  <Text style={[styles.integrationName, { color: colors.textPrimary }]}>
                    Supabase Cloud
                  </Text>
                  <Text style={[styles.integrationDesc, { color: colors.textSecondary }]}>
                    Store metadata, Auth JWTs & PostgreSQL project refs.
                  </Text>
                </View>
              </View>
              <Badge label="Configured" variant="healthy" size="sm" dot />
            </View>
          </Card>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            System Preferences
          </Text>

          <Card style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceText}>
                <Text style={[styles.preferenceTitle, { color: colors.textPrimary }]}>
                  Appearance Mode
                </Text>
                <Text style={[styles.preferenceDesc, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark Theme (Active)' : 'Light Theme (Active)'}
                </Text>
              </View>
              <Badge
                label={isDark ? 'Dark' : 'Light'}
                variant="brand"
                size="sm"
              />
            </View>
          </Card>
        </View>

        {/* App Info Footer */}
        <View style={styles.appFooter}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            App Wallet v1.0.0 (Phase 1 Foundation)
          </Text>
          <Text style={[styles.copyText, { color: colors.textMuted }]}>
            Expo SDK 57 • React Native 0.86 • TypeScript
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  sectionCard: {
    marginBottom: Spacing[6],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  profileText: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[3],
  },
  integrationCard: {
    marginBottom: Spacing[2],
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing[2],
  },
  integrationText: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  integrationName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  integrationDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  preferenceCard: {
    marginBottom: Spacing[2],
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  preferenceDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  appFooter: {
    alignItems: 'center',
    marginTop: Spacing[4],
    paddingTop: Spacing[4],
  },
  versionText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
  },
  copyText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
});

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="App Wallet"
          subtitle="Good morning 👋 — Developer Command Center"
          action={
            <Button
              title="+ Add Project"
              onPress={() => {}}
              variant="primary"
              size="sm"
            />
          }
        />

        {/* Project Statistics Bar */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusHealthy }]}>5</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.statusWarning }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paused</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent }]}>2</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.textMuted }]}>2</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ideas</Text>
          </Card>
        </View>

        {/* Today's Focus Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame-outline" size={18} color={colors.statusWarning} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Today&apos;s Focus
            </Text>
          </View>

          <Card style={styles.projectCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                  AI Study Assistant
                </Text>
                <Badge label="Healthy" variant="healthy" dot size="sm" />
              </View>
              <Text style={[styles.projectDesc, { color: colors.textSecondary }]}>
                Personal study assistant with document RAG and quiz engine.
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Progress: 82%
              </Text>
              <ProgressBar progress={82} color={colors.statusHealthy} height={6} />
            </View>

            <View style={styles.techPills}>
              <Badge label="React" variant="neutral" size="sm" />
              <Badge label="FastAPI" variant="neutral" size="sm" />
              <Badge label="Supabase" variant="neutral" size="sm" />
            </View>
          </Card>

          <Card style={styles.projectCard}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                  Subject Manager
                </Text>
                <Badge label="Needs Attention" variant="warning" dot size="sm" />
              </View>
              <Text style={[styles.projectDesc, { color: colors.textSecondary }]}>
                Curriculum and course planning tool for university students.
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                Progress: 65%
              </Text>
              <ProgressBar progress={65} color={colors.statusWarning} height={6} />
            </View>

            <View style={styles.techPills}>
              <Badge label="Expo" variant="neutral" size="sm" />
              <Badge label="TypeScript" variant="neutral" size="sm" />
            </View>
          </Card>
        </View>

        {/* Needs Attention Alert Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={18} color={colors.statusCritical} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Needs Attention
            </Text>
          </View>

          <Card variant="subtle" style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={[styles.alertProjectName, { color: colors.textPrimary }]}>
                Personal Portfolio
              </Text>
              <Badge label="Stale" variant="critical" size="sm" dot />
            </View>
            <Text style={[styles.alertReason, { color: colors.statusCritical }]}>
              • No GitHub commits for 18 days
            </Text>
            <Text style={[styles.alertReason, { color: colors.statusCritical }]}>
              • Production deployment in Vercel has warning
            </Text>
          </Card>
        </View>
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
  section: {
    marginTop: Spacing[6],
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
});

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface ActivityItem {
  id: string;
  projectName: string;
  type: 'commit' | 'deployment' | 'task' | 'project' | 'warning';
  title: string;
  description: string;
  time: string;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    projectName: 'App Wallet',
    type: 'project',
    title: 'Phase 1 Foundation Implemented',
    description: 'Created design system, theme tokens, Expo Router navigation, and responsive layouts.',
    time: 'Just now',
  },
  {
    id: '2',
    projectName: 'AI Study Assistant',
    type: 'deployment',
    title: 'Vercel Deployment Succeeded',
    description: 'Production deployment #142 is READY (branch: main).',
    time: '2 hours ago',
  },
  {
    id: '3',
    projectName: 'AI Study Assistant',
    type: 'commit',
    title: 'New GitHub Commit Pushed',
    description: 'feat(rag): optimized vector search similarity threshold by @khoihoang',
    time: '4 hours ago',
  },
  {
    id: '4',
    projectName: 'Subject Manager',
    type: 'task',
    title: 'Task Marked Complete',
    description: 'Completed: "Fix Expo Router tab bar inset layout on iOS 18"',
    time: 'Yesterday',
  },
  {
    id: '5',
    projectName: 'Personal Portfolio',
    type: 'warning',
    title: 'Project Inactivity Alert',
    description: 'No GitHub commits or activity detected for 18 days.',
    time: '3 days ago',
  },
];

export default function ActivityScreen() {
  const { colors } = useTheme();

  const getEventIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'commit':
        return <Ionicons name="git-commit-outline" size={18} color={colors.brand} />;
      case 'deployment':
        return <Ionicons name="cloud-upload-outline" size={18} color={colors.statusHealthy} />;
      case 'task':
        return <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />;
      case 'warning':
        return <Ionicons name="alert-circle-outline" size={18} color={colors.statusWarning} />;
      default:
        return <Ionicons name="folder-outline" size={18} color={colors.textPrimary} />;
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
          subtitle="Unified timeline across repositories, deployments & project events"
        />

        <View style={styles.timeline}>
          {MOCK_ACTIVITIES.map((item, index) => (
            <View key={item.id} style={styles.timelineNode}>
              {/* Timeline Indicator Line */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {getEventIcon(item.type)}
                </View>
                {index < MOCK_ACTIVITIES.length - 1 && (
                  <View
                    style={[
                      styles.verticalLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </View>

              {/* Event Content Card */}
              <Card style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Badge label={item.projectName} variant="neutral" size="sm" />
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {item.time}
                  </Text>
                </View>
                <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.eventDesc, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  timeline: {
    marginTop: Spacing[2],
  },
  timelineNode: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: Spacing[3],
    width: 32,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  eventCard: {
    flex: 1,
    padding: Spacing[3],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  eventTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginVertical: 2,
  },
  eventDesc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
  },
});

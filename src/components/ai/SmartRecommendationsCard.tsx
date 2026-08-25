import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSmartRecommendations } from '@/hooks/useAIAssistant';
import { AIAgentPromptModal } from '@/components/modals/AIAgentPromptModal';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function SmartRecommendationsCard() {
  const { colors } = useTheme();
  const { recommendations, loading } = useSmartRecommendations();
  const [selectedPromptProject, setSelectedPromptProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (loading || recommendations.length === 0) return null;

  const top = recommendations[0];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles-outline" size={20} color={colors.brand} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            What should I work on next?
          </Text>
        </View>
        <Badge
          label={top.priority.toUpperCase()}
          variant={top.priority === 'critical' ? 'critical' : 'warning'}
          size="sm"
        />
      </View>

      <View style={styles.contentBox}>
        <Text style={[styles.projectName, { color: colors.brand }]}>
          {top.projectName}
        </Text>
        <Text style={[styles.recTitle, { color: colors.textPrimary }]}>
          {top.title}
        </Text>
        <Text style={[styles.recReason, { color: colors.textSecondary }]}>
          👉 {top.reason}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Button
          title="Take Action"
          onPress={() => router.push(top.targetRoute as any)}
          variant="primary"
          size="sm"
        />
        <Button
          title="Generate AI Prompt"
          onPress={() =>
            setSelectedPromptProject({ id: top.projectId, name: top.projectName })
          }
          variant="outline"
          size="sm"
          icon={<Ionicons name="code-working-outline" size={14} color={colors.textPrimary} />}
        />
      </View>

      {selectedPromptProject && (
        <AIAgentPromptModal
          visible={!!selectedPromptProject}
          projectId={selectedPromptProject.id}
          projectName={selectedPromptProject.name}
          onClose={() => setSelectedPromptProject(null)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: '#6366F140',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  contentBox: {
    marginBottom: Spacing[4],
  },
  projectName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 4,
  },
  recReason: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
});

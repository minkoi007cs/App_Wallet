import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { TechFrequency } from '@/services/analytics';
import { Ionicons } from '@expo/vector-icons';

export function TechStackCard({ techStack }: { techStack: TechFrequency[] }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="code-slash-outline" size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Top Tech Stack & Framework Frequency
        </Text>
      </View>

      <View style={styles.list}>
        {techStack.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tech tags added to projects yet. Add tags like &quot;React&quot;, &quot;Supabase&quot;, or &quot;FastAPI&quot; to see insights!
          </Text>
        ) : (
          techStack.map((item) => (
            <View key={item.tag} style={styles.row}>
              <View style={styles.labelRow}>
                <Text style={[styles.tagName, { color: colors.textPrimary }]}>{item.tag}</Text>
                <Text style={[styles.countText, { color: colors.textSecondary }]}>
                  {item.count} {item.count === 1 ? 'project' : 'projects'} ({item.percentage}%)
                </Text>
              </View>
              <ProgressBar progress={item.percentage} color={colors.accent} height={6} />
            </View>
          ))
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  list: {
    gap: Spacing[3],
  },
  row: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  emptyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
});

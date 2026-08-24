import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { StatusDistribution } from '@/services/analytics';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  paused: '#F59E0B',
  completed: '#0EA5E9',
  idea: '#71717A',
  archived: '#3F3F46',
};

export function StatusDistributionCard({
  averageProgress,
  statusBreakdown,
}: {
  averageProgress: number;
  statusBreakdown: StatusDistribution[];
}) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="pie-chart-outline" size={20} color={colors.brand} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Portfolio Overview & Status Breakdown
          </Text>
        </View>
        <Text style={[styles.avgValue, { color: colors.brand }]}>
          {averageProgress}% Avg Progress
        </Text>
      </View>

      {/* Stacked bar visualization */}
      <View style={styles.stackedBar}>
        {statusBreakdown.map((item) => {
          if (item.percentage === 0) return null;
          return (
            <View
              key={item.status}
              style={{
                flex: item.percentage,
                height: 10,
                backgroundColor: STATUS_COLORS[item.status] || colors.textMuted,
              }}
            />
          );
        })}
      </View>

      {/* Legend list */}
      <View style={styles.legendGrid}>
        {statusBreakdown.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: STATUS_COLORS[item.status] || colors.textMuted },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
              {item.status.toUpperCase()} ({item.count})
            </Text>
            <Text style={[styles.legendPct, { color: colors.textPrimary }]}>
              {item.percentage}%
            </Text>
          </View>
        ))}
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
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  avgValue: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  stackedBar: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing[4],
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    width: '45%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    flex: 1,
  },
  legendPct: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
});

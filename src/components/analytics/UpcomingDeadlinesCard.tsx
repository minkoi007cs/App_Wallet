import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { UpcomingDeadlineItem } from '@/services/analytics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function UpcomingDeadlinesCard({ deadlines }: { deadlines: UpcomingDeadlineItem[] }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="calendar-clear-outline" size={20} color={colors.statusWarning} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Upcoming Project Target Dates
        </Text>
      </View>

      <View style={styles.list}>
        {deadlines.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No target dates approaching soon.
          </Text>
        ) : (
          deadlines.map((item) => {
            const isOverdue = item.daysRemaining < 0;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                onPress={() => router.push(`/project/${item.id}`)}
              >
                <View style={styles.leftCol}>
                  <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    Target: {item.target_date} • {item.progress}% complete
                  </Text>
                </View>

                <Badge
                  label={
                    isOverdue
                      ? `${Math.abs(item.daysRemaining)}D OVERDUE`
                      : `${item.daysRemaining}D LEFT`
                  }
                  variant={isOverdue ? 'critical' : item.daysRemaining <= 7 ? 'warning' : 'neutral'}
                  size="sm"
                />
              </TouchableOpacity>
            );
          })
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    marginRight: Spacing[2],
  },
  projectName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
  },
  emptyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
});

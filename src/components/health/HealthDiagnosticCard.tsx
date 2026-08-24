import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useProjectHealth } from '@/hooks/useHealthEngine';
import { HealthState } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';

export function HealthDiagnosticCard({
  projectId,
  initialHealthStatus,
  initialHealthReasons,
  onRefreshFinished,
}: {
  projectId: string;
  initialHealthStatus: HealthState;
  initialHealthReasons: string[];
  onRefreshFinished?: () => void;
}) {
  const { colors } = useTheme();
  const { evaluating, lastResult, reevaluateHealth } = useProjectHealth(projectId);

  const status = lastResult?.health_status || initialHealthStatus;
  const reasons = lastResult?.health_reasons || initialHealthReasons;

  const handleRefresh = async () => {
    await reevaluateHealth();
    if (onRefreshFinished) {
      onRefreshFinished();
    }
  };

  const getHealthBadge = (st: HealthState) => {
    switch (st) {
      case 'healthy':
        return <Badge label="HEALTHY" variant="healthy" dot size="sm" />;
      case 'needs_attention':
        return <Badge label="NEEDS ATTENTION" variant="warning" dot size="sm" />;
      case 'critical':
        return <Badge label="CRITICAL" variant="critical" dot size="sm" />;
      default:
        return <Badge label="HEALTHY" variant="healthy" dot size="sm" />;
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="pulse-outline" size={20} color={colors.brand} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Project Health Diagnostics
          </Text>
        </View>
        {getHealthBadge(status)}
      </View>

      <View style={styles.reasonsList}>
        {reasons && reasons.length > 0 ? (
          reasons.map((reason, index) => (
            <View key={index} style={styles.reasonRow}>
              <Text
                style={[
                  styles.bullet,
                  {
                    color:
                      status === 'critical'
                        ? colors.statusCritical
                        : status === 'needs_attention'
                        ? colors.statusWarning
                        : colors.statusHealthy,
                  },
                ]}
              >
                •
              </Text>
              <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                {reason}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.reasonText, { color: colors.statusHealthy }]}>
            ✓ Project health status is verified optimal.
          </Text>
        )}
      </View>

      <Button
        title={evaluating ? 'Recalculating...' : 'Recalculate Health Diagnostics'}
        onPress={handleRefresh}
        loading={evaluating}
        variant="outline"
        size="sm"
        style={styles.refreshBtn}
        icon={<Ionicons name="refresh-outline" size={14} color={colors.textPrimary} />}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  reasonsList: {
    gap: Spacing[1],
    marginBottom: Spacing[4],
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  bullet: {
    fontSize: 16,
    lineHeight: 18,
  },
  reasonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
    flex: 1,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
  },
});

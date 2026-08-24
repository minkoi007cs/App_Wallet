import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
    borderRadius: Radius.lg,
    marginVertical: Spacing[4],
  },
  iconWrapper: {
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: Typography.lineHeight.sm,
    marginBottom: Spacing[4],
  },
  button: {
    marginTop: Spacing[2],
  },
});

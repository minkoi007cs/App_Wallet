import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type BadgeVariant =
  | 'default'
  | 'brand'
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  dot = false,
}) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'brand':
        return {
          bg: colors.brand + '20',
          text: colors.brand,
          dot: colors.brand,
        };
      case 'healthy':
        return {
          bg: colors.statusHealthyBg,
          text: colors.statusHealthy,
          dot: colors.statusHealthy,
        };
      case 'warning':
        return {
          bg: colors.statusWarningBg,
          text: colors.statusWarning,
          dot: colors.statusWarning,
        };
      case 'critical':
        return {
          bg: colors.statusCriticalBg,
          text: colors.statusCritical,
          dot: colors.statusCritical,
        };
      case 'neutral':
        return {
          bg: colors.surfaceSubtle,
          text: colors.textSecondary,
          dot: colors.textSecondary,
        };
      default:
        return {
          bg: colors.surfaceSubtle,
          text: colors.textPrimary,
          dot: colors.textPrimary,
        };
    }
  };

  const badgeColors = getColors();

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: badgeColors.bg },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Badge: ${label}`}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: badgeColors.dot },
          ]}
        />
      )}
      <Text
        style={[
          styles.label,
          size === 'sm' ? styles.labelSm : styles.labelMd,
          { color: badgeColors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
  },
  sm: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing[1],
  },
  label: {
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
  },
  labelSm: {
    fontSize: Typography.fontSize.xs,
  },
  labelMd: {
    fontSize: Typography.fontSize.sm,
  },
});

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.surfaceSubtle,
          border: colors.border,
          text: colors.textPrimary,
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: colors.borderStrong,
          text: colors.textPrimary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          text: colors.textPrimary,
        };
      case 'danger':
        return {
          bg: colors.statusCritical,
          border: colors.statusCritical,
          text: '#FFFFFF',
        };
      default:
        return {
          bg: colors.brand,
          border: colors.brand,
          text: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing[1] + 2,
          paddingHorizontal: Spacing[3],
          fontSize: Typography.fontSize.xs,
        };
      case 'lg':
        return {
          paddingVertical: Spacing[3],
          paddingHorizontal: Spacing[6],
          fontSize: Typography.fontSize.base,
        };
      default:
        return {
          paddingVertical: Spacing[2] + 2,
          paddingHorizontal: Spacing[4],
          fontSize: Typography.fontSize.sm,
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy: loading }}
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: variantStyle.text,
                fontSize: sizeStyle.fontSize,
                marginLeft: icon ? Spacing[2] : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  text: {
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

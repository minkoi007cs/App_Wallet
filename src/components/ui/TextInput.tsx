import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.statusCritical : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <RNTextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { color: colors.textPrimary },
            style,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.statusCritical }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
    height: 44,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    height: '100%',
  },
  iconLeft: {
    marginRight: Spacing[2],
  },
  iconRight: {
    marginLeft: Spacing[2],
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: Spacing[1],
  },
});

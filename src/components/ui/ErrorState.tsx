import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.statusCriticalBg,
          borderColor: colors.statusCritical + '40',
        },
        style,
      ]}
    >
      <Text style={[styles.title, { color: colors.statusCritical }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: colors.textPrimary }]}>
        {message}
      </Text>
      {onRetry && (
        <Button
          title="Try Again"
          onPress={onRetry}
          variant="outline"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing[4],
    borderRadius: Radius.md,
    borderWidth: 1,
    marginVertical: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[1],
  },
  message: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[3],
  },
  button: {
    alignSelf: 'flex-start',
  },
});

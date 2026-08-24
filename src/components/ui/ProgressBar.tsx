import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 6,
  style,
}) => {
  const { colors } = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const activeColor = color || colors.brand;

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceSubtle,
          height,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: activeColor,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
  },
});

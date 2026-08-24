import React, { useEffect, useMemo } from 'react';
import { Animated, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = Radius.md,
  style,
}) => {
  const { colors } = useTheme();
  const opacityAnim = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceSubtle,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

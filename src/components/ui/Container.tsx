import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padded = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, padded && styles.padded, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    flex: 1,
  },
  padded: {
    paddingHorizontal: Spacing[4],
  },
});

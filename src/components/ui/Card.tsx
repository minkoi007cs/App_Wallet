import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'subtle' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'subtle':
        return colors.surfaceSubtle;
      case 'outline':
        return 'transparent';
      default:
        return colors.surface;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
  },
});

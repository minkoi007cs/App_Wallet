import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

let toastListener: ((toast: ToastMessage | null) => void) | null = null;

export function showToast(toast: Omit<ToastMessage, 'id'>) {
  if (toastListener) {
    toastListener({ ...toast, id: String(Date.now()) });
  }
}

export const Toast: React.FC = () => {
  const { colors } = useTheme();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    toastListener = (newToast) => {
      setToast(newToast);
      if (newToast) {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(newToast.duration || 3500),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast(null);
        });
      }
    };

    return () => {
      toastListener = null;
    };
  }, [fadeAnim]);

  if (!toast) return null;

  const iconName =
    toast.type === 'success'
      ? 'checkmark-circle'
      : toast.type === 'error'
      ? 'alert-circle'
      : 'information-circle';

  const iconColor =
    toast.type === 'success'
      ? colors.statusHealthy
      : toast.type === 'error'
      ? colors.statusCritical
      : colors.brand;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: fadeAnim,
        },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{toast.title}</Text>
        {toast.message && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>{toast.message}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    maxWidth: 420,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 9999,
  },
  icon: {
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  message: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
});

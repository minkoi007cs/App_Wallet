import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  showNotificationBell?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  action,
  showNotificationBell = true,
  style,
}) => {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightGroup}>
        {showNotificationBell && (
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: colors.statusCritical }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {action && <View style={styles.actionContainer}>{action}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    marginTop: Spacing[1],
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginLeft: Spacing[3],
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  actionContainer: {},
});

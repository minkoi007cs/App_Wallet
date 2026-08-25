import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.header}>
            <Ionicons
              name={variant === 'danger' ? 'warning-outline' : 'help-circle-outline'}
              size={24}
              color={variant === 'danger' ? colors.statusCritical : colors.brand}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="outline"
              size="sm"
              disabled={loading}
              style={styles.btn}
            />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={variant}
              size="sm"
              loading={loading}
              style={styles.btn}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing[5],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
  },
  btn: {
    minWidth: 90,
  },
});

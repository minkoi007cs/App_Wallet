import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { normalizeSupabaseApiUrl } from '@/services/supabaseStatus';
import { Ionicons } from '@expo/vector-icons';

interface SetUrlsModalProps {
  visible: boolean;
  initialFrontendUrl?: string | null;
  initialBackendUrl?: string | null;
  initialSupabaseUrl?: string | null;
  onClose: () => void;
  onSave: (urls: {
    frontend_url: string | null;
    backend_url: string | null;
    supabase_url: string | null;
  }) => Promise<unknown>;
}

function SetUrlsContent({
  initialFrontendUrl = '',
  initialBackendUrl = '',
  initialSupabaseUrl = '',
  onClose,
  onSave,
}: Omit<SetUrlsModalProps, 'visible'>) {
  const { colors } = useTheme();
  const [frontendUrl, setFrontendUrl] = useState(initialFrontendUrl || '');
  const [backendUrl, setBackendUrl] = useState(initialBackendUrl || '');
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabaseUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalSupabase = supabaseUrl.trim();
      if (finalSupabase) {
        const normalized = normalizeSupabaseApiUrl(finalSupabase);
        if (normalized) finalSupabase = normalized;
      }

      await onSave({
        frontend_url: frontendUrl.trim() || null,
        backend_url: backendUrl.trim() || null,
        supabase_url: finalSupabase || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    setFrontendUrl('');
    setBackendUrl('');
    setSupabaseUrl('');
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconBox, { backgroundColor: colors.brand + '20' }]}>
              <Ionicons name="link-outline" size={20} color={colors.brand} />
            </View>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Edit Deployment & Database URLs
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Manage live Vercel & Supabase connections for this project
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Frontend URL */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="globe-outline" size={16} color={colors.statusHealthy} />
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Frontend Vercel URL
              </Text>
            </View>
            <RNTextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={frontendUrl}
              onChangeText={setFrontendUrl}
              placeholder="e.g. https://app-wallet-gamma.vercel.app"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Backend URL */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="server-outline" size={16} color={colors.accent} />
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Backend Vercel / API URL
              </Text>
            </View>
            <RNTextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="e.g. https://api.myproject.vercel.app"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Supabase URL */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="flash-outline" size={16} color={colors.brand} />
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Supabase Project URL or Project Ref
              </Text>
            </View>
            <RNTextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              placeholder="e.g. https://lnuijfoohwvunatwuqjx.supabase.co or lnuijfoohwvunatwuqjx"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Supports full URL, dashboard link, or 20-character project ref.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <Button
            title="Clear All"
            onPress={handleClearAll}
            variant="ghost"
            size="sm"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              size="sm"
            />
            <Button
              title={saving ? 'Saving...' : 'Save URLs'}
              onPress={handleSave}
              loading={saving}
              variant="primary"
              size="sm"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export function SetUrlsModal(props: SetUrlsModalProps) {
  if (!props.visible) return null;

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <SetUrlsContent {...props} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: Spacing[4],
  },
  inputGroup: {
    marginBottom: Spacing[4],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
  },
  helperText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderTopWidth: 1,
  },
});

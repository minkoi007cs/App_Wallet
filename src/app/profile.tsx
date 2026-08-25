import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { signOut, updateProfile } from '@/services/auth';
import { runSecurityAudit, exportUserDataJson, SecurityAuditResult } from '@/services/securityAudit';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        const res = await runSecurityAudit();
        setAuditResult(res);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateName = async () => {
    if (!fullName.trim()) return;
    setUpdating(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      Alert.alert('Success', 'Profile name updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const json = await exportUserDataJson();
      setExportedJson(json);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Container padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Account & Security"
          subtitle="User profile, data privacy & RLS security audit"
          action={
            <Button
              title="Back"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
            />
          }
        />

        {/* User Account Overview */}
        <Card style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.brand }]}>
              <Text style={styles.avatarText}>
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={[styles.emailText, { color: colors.textPrimary }]}>
                {user?.email || 'dev-user@appwallet.internal'}
              </Text>
              <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                App Wallet Owner • Multi-Tenant Isolated
              </Text>
            </View>
          </View>

          <TextInput
            label="Full Name"
            placeholder="e.g. Khoi Hoang"
            value={fullName}
            onChangeText={setFullName}
            leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
          />

          <Button
            title={updating ? 'Updating...' : 'Save Profile Name'}
            onPress={handleUpdateName}
            loading={updating}
            variant="primary"
            size="sm"
            style={styles.saveBtn}
          />
        </Card>

        {/* Security Audit Report */}
        {auditResult && (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Ionicons name="shield-checkmark-outline" size={22} color={colors.statusHealthy} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Security Architecture Audit
                </Text>
              </View>
              <Badge
                label={`${auditResult.score}% SECURE`}
                variant={auditResult.score >= 80 ? 'healthy' : 'warning'}
                size="sm"
              />
            </View>

            <View style={styles.checksList}>
              {auditResult.checks.map((c, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <Ionicons
                    name={
                      c.status === 'pass'
                        ? 'checkmark-circle-outline'
                        : c.status === 'warn'
                        ? 'warning-outline'
                        : 'close-circle-outline'
                    }
                    size={18}
                    color={
                      c.status === 'pass'
                        ? colors.statusHealthy
                        : c.status === 'warn'
                        ? colors.statusWarning
                        : colors.statusCritical
                    }
                  />
                  <View style={styles.checkTextCol}>
                    <Text style={[styles.checkName, { color: colors.textPrimary }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.checkDetails, { color: colors.textSecondary }]}>
                      {c.details}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Export Data Backup */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="download-outline" size={22} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Export Account Data
              </Text>
            </View>
          </View>

          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            Download a full JSON backup of all your projects, tasks, milestones, and development journal entries.
          </Text>

          <Button
            title={exporting ? 'Exporting...' : 'Export Data (JSON)'}
            onPress={handleExportData}
            loading={exporting}
            variant="outline"
            size="sm"
            style={styles.saveBtn}
          />

          {exportedJson && (
            <View style={styles.exportBox}>
              <Text style={[styles.exportBoxTitle, { color: colors.statusHealthy }]}>
                ✓ Export Ready ({exportedJson.length} bytes)
              </Text>
              <Text style={[styles.exportPreview, { color: colors.textMuted }]} numberOfLines={6}>
                {exportedJson}
              </Text>
            </View>
          )}
        </Card>

        {/* Sign Out Action */}
        <Button
          title="Sign Out of App Wallet"
          onPress={() => signOut()}
          variant="danger"
          style={styles.signOutBtn}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  card: {
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[4],
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  userInfo: {
    flex: 1,
  },
  emailText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  roleText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: Spacing[3],
    alignSelf: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  checksList: {
    gap: Spacing[3],
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  checkTextCol: {
    flex: 1,
  },
  checkName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  checkDetails: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.sans,
    marginTop: 2,
  },
  bodyText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    lineHeight: Typography.lineHeight.xs,
  },
  exportBox: {
    backgroundColor: '#18181B50',
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginTop: Spacing[3],
  },
  exportBoxTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 4,
  },
  exportPreview: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.mono,
  },
  signOutBtn: {
    marginTop: Spacing[2],
  },
});

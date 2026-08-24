import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useMilestones } from '@/hooks/useMilestones';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MilestoneRow, MilestoneStatus, CreateMilestoneInput } from '@/services/milestones';

const STATUS_CONFIG: Record<MilestoneStatus, { color: string; icon: string; label: string }> = {
  planned: { color: '#71717A', icon: 'time-outline', label: 'Planned' },
  in_progress: { color: '#6366F1', icon: 'rocket-outline', label: 'In Progress' },
  completed: { color: '#10B981', icon: 'checkmark-circle-outline', label: 'Completed' },
  missed: { color: '#EF4444', icon: 'close-circle-outline', label: 'Missed' },
};

function MilestoneCard({
  milestone,
  onDelete,
  onStatusChange,
}: {
  milestone: MilestoneRow;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MilestoneStatus) => void;
}) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[milestone.status as MilestoneStatus] || STATUS_CONFIG.planned;
  const isOverdue =
    milestone.target_date &&
    new Date(milestone.target_date) < new Date() &&
    milestone.status !== 'completed';

  return (
    <View style={styles.timelineRow}>
      {/* Timeline dot + line */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={14} color="#fff" />
        </View>
        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Content card */}
      <Card style={styles.milestoneCard}>
        <View style={styles.milestoneHeader}>
          <Text style={[styles.milestoneName, { color: colors.textPrimary }]}>{milestone.name}</Text>
          <Badge
            label={cfg.label}
            variant={milestone.status === 'completed' ? 'healthy' : milestone.status === 'missed' ? 'critical' : 'neutral'}
            size="sm"
          />
        </View>
        {milestone.description && (
          <Text style={[styles.milestoneDesc, { color: colors.textSecondary }]}>
            {milestone.description}
          </Text>
        )}
        {milestone.target_date && (
          <Text style={[styles.milestoneDate, { color: isOverdue ? colors.statusCritical : colors.textMuted }]}>
            {isOverdue ? '⚠️ Overdue — ' : '📅 '}
            Target: {milestone.target_date}
          </Text>
        )}
        <View style={styles.milestoneActions}>
          {milestone.status !== 'completed' && (
            <Button
              title="Mark Complete"
              onPress={() => onStatusChange(milestone.id, 'completed')}
              variant="outline"
              size="sm"
            />
          )}
          <Button
            title="Delete"
            onPress={() => onDelete(milestone.id)}
            variant="danger"
            size="sm"
          />
        </View>
      </Card>
    </View>
  );
}

function AddMilestoneModal({
  visible,
  projectId,
  onClose,
  onSave,
}: {
  visible: boolean;
  projectId: string;
  onClose: () => void;
  onSave: (data: CreateMilestoneInput) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('planned');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        project_id: projectId,
        name: name.trim(),
        description: description || undefined,
        status,
        target_date: targetDate || undefined,
      });
      setName('');
      setDescription('');
      setTargetDate('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Milestone</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalBody}>
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name *</Text>
          <RNTextInput
            style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. MVP Launch"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description</Text>
          <RNTextInput
            style={[styles.modalInput, styles.modalMultiline, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What should be achieved by this milestone?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Status</Text>
          <View style={styles.chipRow}>
            {(Object.keys(STATUS_CONFIG) as MilestoneStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[styles.chip, { backgroundColor: status === s ? cfg.color : colors.surfaceSubtle, borderColor: cfg.color }]}
                >
                  <Text style={[styles.chipText, { color: status === s ? '#fff' : colors.textPrimary }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Target Date (YYYY-MM-DD)</Text>
          <RNTextInput
            style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="2026-09-30"
            placeholderTextColor={colors.textMuted}
          />

          <Button title={saving ? 'Saving...' : 'Create Milestone'} onPress={handleSave} loading={saving} variant="primary" style={styles.modalSaveBtn} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProjectMilestonesScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id as string;
  const { milestones, loading, error, load, createMilestone, updateMilestone, deleteMilestone } = useMilestones(projectId);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => { if (active) await load(); })();
    return () => { active = false; };
  }, [load]);

  const handleStatusChange = async (msId: string, status: MilestoneStatus) => {
    await updateMilestone(msId, { status });
  };

  const completed = milestones.filter((m) => m.status === 'completed').length;

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Milestones"
          subtitle={`${completed} / ${milestones.length} completed`}
          action={
            <Button title="+ Milestone" onPress={() => setShowModal(true)} variant="primary" size="sm" />
          }
        />

        {/* Progress summary */}
        {milestones.length > 0 && (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              {(Object.keys(STATUS_CONFIG) as MilestoneStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const count = milestones.filter((m) => m.status === s).length;
                return (
                  <View key={s} style={styles.summaryItem}>
                    <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{cfg.label}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {loading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={100} borderRadius={Radius.lg} />
            <Skeleton height={100} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : milestones.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No milestones yet. Define key goals for your project!
            </Text>
          </Card>
        ) : (
          <View style={styles.timeline}>
            {milestones.map((ms) => (
              <MilestoneCard
                key={ms.id}
                milestone={ms}
                onDelete={deleteMilestone}
                onStatusChange={handleStatusChange}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.backLink} onPress={() => router.push(`/project/${projectId}`)}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.brand} />
          <Text style={[styles.backText, { color: colors.brand }]}>Back to Project</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddMilestoneModal
        visible={showModal}
        projectId={projectId}
        onClose={() => setShowModal(false)}
        onSave={createMilestone}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: Spacing[10] },
  summaryCard: { marginBottom: Spacing[4], padding: Spacing[4] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryCount: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.sans },
  summaryLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, marginTop: 2 },
  skeletonBlock: { gap: Spacing[3] },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[2] },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineLine: { flex: 1, width: 2, marginTop: 4, marginBottom: -8 },
  milestoneCard: { flex: 1, padding: Spacing[4], marginBottom: Spacing[3] },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  milestoneName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, fontFamily: Typography.fontFamily.sans, flex: 1, marginRight: Spacing[2] },
  milestoneDesc: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, lineHeight: Typography.lineHeight.xs, marginBottom: Spacing[2] },
  milestoneDate: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[3] },
  milestoneActions: { flexDirection: 'row', gap: Spacing[2] },
  emptyCard: { padding: Spacing[8], alignItems: 'center' },
  emptyText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], marginTop: Spacing[6] },
  backText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[5], borderBottomWidth: 1, borderBottomColor: '#27272A30' },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.sans },
  modalBody: { padding: Spacing[5], paddingBottom: Spacing[10] },
  modalLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[2], textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing[4] },
  modalInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing[3], fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  modalMultiline: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.md, borderWidth: 1 },
  chipText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, fontFamily: Typography.fontFamily.sans },
  modalSaveBtn: { marginTop: Spacing[6] },
});

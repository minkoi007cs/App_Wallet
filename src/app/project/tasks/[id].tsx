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
import { useTasks } from '@/hooks/useTasks';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TaskStatus, ProjectPriority } from '@/types/database';
import { TaskWithSubtasks } from '@/services/tasks';

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: 'To Do', color: '#71717A' },
  { key: 'in_progress', label: 'In Progress', color: '#6366F1' },
  { key: 'review', label: 'Review', color: '#F59E0B' },
  { key: 'done', label: 'Done', color: '#10B981' },
];

const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7C3AED',
};

function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onToggleSubtask,
}: {
  task: TaskWithSubtasks;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (subId: string, taskId: string, done: boolean) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const completedSubs = (task.subtasks || []).filter((s) => s.is_completed).length;
  const totalSubs = (task.subtasks || []).length;

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'review',
    review: 'done',
    done: 'todo',
  };

  return (
    <Card style={styles.taskCard}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <View style={styles.taskCardHeader}>
          {/* Priority dot */}
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
          <View style={styles.taskTitleBlock}>
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {task.title}
            </Text>
            {task.due_date && (
              <Text style={[styles.taskDue, { color: colors.textMuted }]}>
                📅 {task.due_date}
              </Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={colors.textMuted}
          />
        </View>

        {/* Tags & subtask counter */}
        <View style={styles.taskMeta}>
          {task.tags.map((tag) => (
            <Badge key={tag} label={tag} variant="neutral" size="sm" />
          ))}
          {totalSubs > 0 && (
            <Text style={[styles.subCount, { color: colors.textSecondary }]}>
              ✓ {completedSubs}/{totalSubs}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedSection}>
          {task.description && (
            <Text style={[styles.taskDesc, { color: colors.textSecondary }]}>
              {task.description}
            </Text>
          )}
          {task.notes && (
            <Text style={[styles.taskNotes, { color: colors.textMuted }]}>
              💬 {task.notes}
            </Text>
          )}

          {/* Subtasks */}
          {(task.subtasks || []).map((sub) => (
            <TouchableOpacity
              key={sub.id}
              onPress={() => onToggleSubtask(sub.id, task.id, !sub.is_completed)}
              style={styles.subtaskRow}
            >
              <Ionicons
                name={sub.is_completed ? 'checkbox' : 'square-outline'}
                size={18}
                color={sub.is_completed ? colors.statusHealthy : colors.textMuted}
              />
              <Text
                style={[
                  styles.subtaskText,
                  {
                    color: sub.is_completed ? colors.textMuted : colors.textPrimary,
                    textDecorationLine: sub.is_completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Actions */}
          <View style={styles.taskActions}>
            <Button
              title={`Move → ${nextStatus[task.status].replace('_', ' ')}`}
              onPress={() => onStatusChange(task.id, nextStatus[task.status])}
              variant="outline"
              size="sm"
            />
            <Button
              title="Delete"
              onPress={() => onDelete(task.id)}
              variant="danger"
              size="sm"
            />
          </View>
        </View>
      )}
    </Card>
  );
}

function AddTaskModal({
  visible,
  projectId,
  onClose,
  onSave,
}: {
  visible: boolean;
  projectId: string;
  onClose: () => void;
  onSave: (data: any) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        project_id: projectId,
        title: title.trim(),
        description: description || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setTags('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Task</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody}>
          {/* Title */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title *</Text>
          <RNTextInput
            style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Implement auth flow"
            placeholderTextColor={colors.textMuted}
          />

          {/* Description */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Description</Text>
          <RNTextInput
            style={[styles.modalInput, styles.modalMultiline, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional context..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Status */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Status</Text>
          <View style={styles.chipRow}>
            {STATUS_COLUMNS.map((s) => (
              <TouchableOpacity
                key={s.key}
                onPress={() => setStatus(s.key)}
                style={[styles.chip, { backgroundColor: status === s.key ? s.color : colors.surfaceSubtle, borderColor: s.color }]}
              >
                <Text style={[styles.chipText, { color: status === s.key ? '#fff' : colors.textPrimary }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Priority</Text>
          <View style={styles.chipRow}>
            {(Object.entries(PRIORITY_COLORS) as [ProjectPriority, string][]).map(([p, col]) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[styles.chip, { backgroundColor: priority === p ? col : colors.surfaceSubtle, borderColor: col }]}
              >
                <Text style={[styles.chipText, { color: priority === p ? '#fff' : colors.textPrimary }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Date */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Due Date (YYYY-MM-DD)</Text>
          <RNTextInput
            style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-09-30"
            placeholderTextColor={colors.textMuted}
          />

          {/* Tags */}
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tags (comma separated)</Text>
          <RNTextInput
            style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={tags}
            onChangeText={setTags}
            placeholder="backend, auth, API"
            placeholderTextColor={colors.textMuted}
          />

          <Button
            title={saving ? 'Saving...' : 'Create Task'}
            onPress={handleSave}
            loading={saving}
            variant="primary"
            style={styles.modalSaveBtn}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ProjectTasksScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id as string;
  const { tasks, loading, error, load, createTask, updateTaskStatus, deleteTask, toggleSubtask } = useTasks(projectId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    let active = true;
    (async () => { if (active) await load(); })();
    return () => { active = false; };
  }, [load]);

  const filteredTasks = activeColumn === 'all' ? tasks : tasks.filter((t) => t.status === activeColumn);

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Tasks"
          subtitle={`${tasks.length} tasks across all stages`}
          action={
            <Button
              title="+ New Task"
              onPress={() => setShowAddModal(true)}
              variant="primary"
              size="sm"
            />
          }
        />

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.columnScroll}>
          <View style={styles.columnTabsRow}>
            {[{ key: 'all', label: 'All', color: colors.brand }, ...STATUS_COLUMNS].map((col) => {
              const isActive = activeColumn === col.key;
              const count = col.key === 'all' ? tasks.length : tasks.filter((t) => t.status === col.key).length;
              return (
                <TouchableOpacity
                  key={col.key}
                  onPress={() => setActiveColumn(col.key as TaskStatus | 'all')}
                  style={[
                    styles.columnTab,
                    {
                      backgroundColor: isActive ? (col as any).color : colors.surfaceSubtle,
                      borderColor: (col as any).color,
                    },
                  ]}
                >
                  <Text style={[styles.columnTabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                    {col.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {loading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={120} borderRadius={Radius.lg} />
            <Skeleton height={120} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks found. Hit &quot;+ New Task&quot; to create one!
            </Text>
          </Card>
        ) : (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateTaskStatus}
                onDelete={deleteTask}
                onToggleSubtask={toggleSubtask}
              />
            ))}
          </View>
        )}

        {/* Back link */}
        <TouchableOpacity style={styles.backLink} onPress={() => router.push(`/project/${projectId}`)}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.brand} />
          <Text style={[styles.backText, { color: colors.brand }]}>Back to Project</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddTaskModal
        visible={showAddModal}
        projectId={projectId}
        onClose={() => setShowAddModal(false)}
        onSave={createTask}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: Spacing[10] },
  columnScroll: { marginBottom: Spacing[4] },
  columnTabsRow: { flexDirection: 'row', gap: Spacing[2] },
  columnTab: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  columnTabText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  skeletonBlock: { gap: Spacing[3] },
  taskList: { gap: Spacing[3] },
  taskCard: { padding: Spacing[4] },
  taskCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  taskTitleBlock: { flex: 1 },
  taskTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: 2,
  },
  taskDue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1], marginTop: Spacing[2], alignItems: 'center' },
  subCount: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, marginLeft: Spacing[2] },
  expandedSection: { marginTop: Spacing[3], borderTopWidth: 1, borderTopColor: '#27272A30', paddingTop: Spacing[3] },
  taskDesc: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[2] },
  taskNotes: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[2], fontStyle: 'italic' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  subtaskText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  taskActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[3] },
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

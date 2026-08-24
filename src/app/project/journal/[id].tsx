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
import { useJournal } from '@/hooks/useJournal';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JournalRow, CreateJournalInput } from '@/services/journal';

function JournalEntryCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: JournalRow;
  onDelete: (id: string) => void;
  onEdit: (entry: JournalRow) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('## ')) {
        return (
          <Text key={idx} style={[styles.journalH2, { color: colors.textPrimary }]}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <Text key={idx} style={[styles.journalBullet, { color: colors.textSecondary }]}>
            • {line.replace('- ', '')}
          </Text>
        );
      }
      if (line.trim() === '') return <View key={idx} style={{ height: 8 }} />;
      return (
        <Text key={idx} style={[styles.journalBody, { color: colors.textSecondary }]}>
          {line}
        </Text>
      );
    });
  };

  return (
    <Card style={styles.journalCard}>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.85}>
        <View style={styles.journalCardHeader}>
          <View style={styles.journalTitleBlock}>
            <Text style={[styles.journalTitle, { color: colors.textPrimary }]}>{entry.title}</Text>
            <Text style={[styles.journalDate, { color: colors.textMuted }]}>
              {new Date(entry.created_at).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={colors.textMuted}
          />
        </View>
        {entry.tags.length > 0 && (
          <View style={styles.journalTagsRow}>
            {entry.tags.map((tag) => (
              <Badge key={tag} label={tag} variant="neutral" size="sm" />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.journalExpanded}>
          <View style={styles.journalContentBlock}>{renderContent(entry.content)}</View>
          <View style={styles.journalActions}>
            <Button title="Edit" onPress={() => onEdit(entry)} variant="outline" size="sm" />
            <Button title="Delete" onPress={() => onDelete(entry.id)} variant="danger" size="sm" />
          </View>
        </View>
      )}
    </Card>
  );
}

function JournalEditorForm({
  projectId,
  editEntry,
  onClose,
  onSave,
  onUpdate,
}: {
  projectId: string;
  editEntry: JournalRow | null;
  onClose: () => void;
  onSave: (input: CreateJournalInput) => Promise<unknown>;
  onUpdate: (id: string, input: Partial<CreateJournalInput>) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [title, setTitle] = useState(editEntry?.title || '');
  const [content, setContent] = useState(editEntry?.content || '');
  const [tags, setTags] = useState(editEntry?.tags.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editEntry;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      project_id: projectId,
      title: title.trim(),
      content: content.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (isEditing && editEntry) {
        await onUpdate(editEntry.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.modalBody}>
      <Text style={[styles.modalHint, { color: colors.textMuted }]}>
        ✍️ Supports Markdown-lite: ## Heading, - bullet, **bold**
      </Text>

      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title *</Text>
      <RNTextInput
        style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Completed vector search endpoint"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Content</Text>
      <RNTextInput
        style={[styles.modalInput, styles.journalTextArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
        value={content}
        onChangeText={setContent}
        placeholder={`## Summary\nDescribe what you accomplished today.\n\n## Decisions made\n- Decision 1\n- Decision 2\n\n## Next steps\n- ...`}
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={12}
        textAlignVertical="top"
      />

      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Tags (comma separated)</Text>
      <RNTextInput
        style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
        value={tags}
        onChangeText={setTags}
        placeholder="backend, milestone, decision"
        placeholderTextColor={colors.textMuted}
      />

      <Button
        title={saving ? 'Saving...' : isEditing ? 'Update Entry' : 'Publish Entry'}
        onPress={handleSave}
        loading={saving}
        variant="primary"
        style={styles.modalSaveBtn}
      />
    </ScrollView>
  );
}

function JournalEditorModal({
  visible,
  projectId,
  editEntry,
  onClose,
  onSave,
  onUpdate,
}: {
  visible: boolean;
  projectId: string;
  editEntry: JournalRow | null;
  onClose: () => void;
  onSave: (input: CreateJournalInput) => Promise<unknown>;
  onUpdate: (id: string, input: Partial<CreateJournalInput>) => Promise<unknown>;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {editEntry ? 'Edit Entry' : 'New Journal Entry'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {visible && (
          <JournalEditorForm
            key={editEntry ? editEntry.id : 'new-entry'}
            projectId={projectId}
            editEntry={editEntry}
            onClose={onClose}
            onSave={onSave}
            onUpdate={onUpdate}
          />
        )}
      </View>
    </Modal>
  );
}

export default function ProjectJournalScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id as string;
  const { entries, loading, error, load, createEntry, updateEntry, deleteEntry } = useJournal(projectId);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalRow | null>(null);

  useEffect(() => {
    let active = true;
    (async () => { if (active) await load(); })();
    return () => { active = false; };
  }, [load]);

  const handleEdit = (entry: JournalRow) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Header
          title="Dev Journal"
          subtitle={`${entries.length} entries — your development story`}
          action={
            <Button
              title="+ New Entry"
              onPress={() => { setEditingEntry(null); setShowModal(true); }}
              variant="primary"
              size="sm"
            />
          }
        />

        {loading ? (
          <View style={styles.skeletonBlock}>
            <Skeleton height={100} borderRadius={Radius.lg} />
            <Skeleton height={100} borderRadius={Radius.lg} />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : entries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start your engineering journal. Record decisions, breakthroughs, and learnings!
            </Text>
          </Card>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteEntry}
                onEdit={handleEdit}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.backLink} onPress={() => router.push(`/project/${projectId}`)}>
          <Ionicons name="arrow-back-outline" size={16} color={colors.brand} />
          <Text style={[styles.backText, { color: colors.brand }]}>Back to Project</Text>
        </TouchableOpacity>
      </ScrollView>

      <JournalEditorModal
        visible={showModal}
        projectId={projectId}
        editEntry={editingEntry}
        onClose={handleClose}
        onSave={createEntry}
        onUpdate={updateEntry}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: Spacing[10] },
  skeletonBlock: { gap: Spacing[3] },
  entriesList: { gap: Spacing[3] },
  journalCard: { padding: Spacing[4] },
  journalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  journalTitleBlock: { flex: 1, marginRight: Spacing[2] },
  journalTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, fontFamily: Typography.fontFamily.sans, marginBottom: 2 },
  journalDate: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans },
  journalTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[1], marginTop: Spacing[2] },
  journalExpanded: { marginTop: Spacing[4], borderTopWidth: 1, borderTopColor: '#27272A30', paddingTop: Spacing[4] },
  journalContentBlock: { marginBottom: Spacing[4] },
  journalH2: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.sans, marginBottom: 4, marginTop: Spacing[3] },
  journalBullet: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans, marginBottom: 2, paddingLeft: Spacing[2] },
  journalBody: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans, lineHeight: Typography.lineHeight.sm, marginBottom: 2 },
  journalActions: { flexDirection: 'row', gap: Spacing[2] },
  emptyCard: { padding: Spacing[8], alignItems: 'center' },
  emptyText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans, textAlign: 'center', lineHeight: Typography.lineHeight.sm },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], marginTop: Spacing[6] },
  backText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[5], borderBottomWidth: 1, borderBottomColor: '#27272A30' },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.sans },
  modalBody: { padding: Spacing[5], paddingBottom: Spacing[10] },
  modalHint: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[4] },
  modalLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, fontFamily: Typography.fontFamily.sans, marginBottom: Spacing[2], textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing[4] },
  modalInput: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing[3], fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.sans },
  journalTextArea: { height: 240, textAlignVertical: 'top' },
  modalSaveBtn: { marginTop: Spacing[6] },
});

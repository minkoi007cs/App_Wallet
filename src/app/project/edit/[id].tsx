import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Container } from '@/components/ui/Container';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useProjectDetail } from '@/hooks/useProjects';
import { updateProject, deleteProject, ProjectWithDetails } from '@/services/projects';
import { validateProjectInput } from '@/lib/validation/project';
import { ProjectPriority, ProjectStatus } from '@/types/database';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: 'Idea', value: 'idea' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
];

const PRIORITY_OPTIONS: { label: string; value: ProjectPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

function EditProjectForm({ project }: { project: ProjectWithDetails }) {
  const { colors } = useTheme();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [priority, setPriority] = useState<ProjectPriority>(project.priority);
  const [progress, setProgress] = useState(String(project.progress));
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [targetDate, setTargetDate] = useState(project.target_date || '');
  const [tagsInput, setTagsInput] = useState(project.tags.join(', '));

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const numericProgress = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const inputData = {
      name,
      description,
      status,
      priority,
      progress: numericProgress,
      start_date: startDate || undefined,
      target_date: targetDate || undefined,
      tags,
    };

    const validation = validateProjectInput(inputData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setServerError(null);

    try {
      await updateProject(project.id, inputData);
      router.back();
    } catch (err: any) {
      setServerError(err.message || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      router.replace('/(tabs)/projects');
    } catch (err: any) {
      setServerError(err.message || 'Failed to delete project.');
      setDeleting(false);
    }
  };

  return (
    <Card style={styles.formCard}>
      {serverError && <ErrorState message={serverError} style={styles.alert} />}

      {/* Project Name */}
      <TextInput
        label="Project Name *"
        value={name}
        onChangeText={setName}
        error={formErrors.name}
        leftIcon={<Ionicons name="folder-outline" size={18} color={colors.textMuted} />}
      />

      {/* Description */}
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={styles.multilineInput}
      />

      {/* Status Picker */}
      <View style={styles.fieldSection}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Status
        </Text>
        <View style={styles.optionRow}>
          {STATUS_OPTIONS.map((opt) => {
            const isSelected = status === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.brand : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.brand : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Priority Picker */}
      <View style={styles.fieldSection}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Priority
        </Text>
        <View style={styles.optionRow}>
          {PRIORITY_OPTIONS.map((opt) => {
            const isSelected = priority === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setPriority(opt.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.textPrimary : colors.surfaceSubtle,
                    borderColor: isSelected ? colors.textPrimary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? colors.background : colors.textPrimary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Progress Percentage */}
      <TextInput
        label="Progress (0 - 100%)"
        value={progress}
        onChangeText={setProgress}
        keyboardType="number-pad"
        error={formErrors.progress}
        leftIcon={<Ionicons name="stats-chart-outline" size={18} color={colors.textMuted} />}
      />

      {/* Dates Row */}
      <View style={styles.datesRow}>
        <View style={styles.dateCol}>
          <TextInput
            label="Start Date"
            value={startDate}
            onChangeText={setStartDate}
            leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.textMuted} />}
          />
        </View>
        <View style={styles.dateCol}>
          <TextInput
            label="Target Date"
            value={targetDate}
            onChangeText={setTargetDate}
            error={formErrors.target_date}
            leftIcon={<Ionicons name="flag-outline" size={18} color={colors.textMuted} />}
          />
        </View>
      </View>

      {/* Tech Stack Tags */}
      <TextInput
        label="Technologies / Tags"
        value={tagsInput}
        onChangeText={setTagsInput}
        leftIcon={<Ionicons name="pricetags-outline" size={18} color={colors.textMuted} />}
      />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSubmit}
          loading={saving}
          variant="primary"
          style={styles.flexBtn}
        />
        <Button
          title={deleting ? 'Deleting...' : 'Delete'}
          onPress={handleDelete}
          loading={deleting}
          variant="danger"
          style={styles.flexBtn}
        />
      </View>
    </Card>
  );
}

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { project, loading: loadingDetail, error: detailError } = useProjectDetail(id as string);

  if (loadingDetail) {
    return (
      <Container padded>
        <Header title="Edit Project" />
        <Skeleton height={200} borderRadius={Radius.lg} />
      </Container>
    );
  }

  if (detailError || !project) {
    return (
      <Container padded>
        <Header title="Edit Project" />
        <ErrorState message={detailError || 'Project not found.'} />
      </Container>
    );
  }

  return (
    <Container padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header
          title="Edit Project"
          subtitle={`Modifying ${project.name}`}
          action={
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
            />
          }
        />

        <EditProjectForm project={project} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  alert: {
    marginBottom: Spacing[4],
  },
  formCard: {
    padding: Spacing[5],
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing[2],
  },
  fieldSection: {
    marginBottom: Spacing[4],
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    fontWeight: Typography.fontWeight.semibold,
  },
  datesRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  dateCol: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  flexBtn: {
    flex: 1,
  },
});

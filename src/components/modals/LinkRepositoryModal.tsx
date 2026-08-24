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
import { Badge } from '@/components/ui/Badge';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { GitHubRepoItem, LinkRepoInput } from '@/services/github';
import { RepoRole } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';

const ROLES: { label: string; value: RepoRole }[] = [
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'AI / Model', value: 'ai' },
  { label: 'Other', value: 'other' },
];

export function LinkRepositoryModal({
  visible,
  projectId,
  availableRepos,
  onClose,
  onLink,
}: {
  visible: boolean;
  projectId: string;
  availableRepos: GitHubRepoItem[];
  onClose: () => void;
  onLink: (input: LinkRepoInput) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepoItem | null>(null);
  const [role, setRole] = useState<RepoRole>('frontend');
  const [search, setSearch] = useState('');
  const [linking, setLinking] = useState(false);

  const filteredRepos = availableRepos.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmLink = async () => {
    if (!selectedRepo) return;
    setLinking(true);
    try {
      await onLink({
        project_id: projectId,
        owner: selectedRepo.owner,
        name: selectedRepo.name,
        url: selectedRepo.url,
        role,
        default_branch: selectedRepo.default_branch,
        primary_language: selectedRepo.primary_language,
        stars_count: selectedRepo.stars_count,
        forks_count: selectedRepo.forks_count,
        open_issues_count: selectedRepo.open_issues_count,
      });
      setSelectedRepo(null);
      onClose();
    } finally {
      setLinking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Link GitHub Repository</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* 1. Search repo */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Select Repository</Text>
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Search GitHub repositories..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.repoList}>
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <TouchableOpacity
                  key={repo.id}
                  onPress={() => setSelectedRepo(repo)}
                  style={[
                    styles.repoItem,
                    {
                      backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <View style={styles.repoItemHeader}>
                    <Ionicons name="logo-github" size={18} color={colors.textPrimary} />
                    <Text style={[styles.repoName, { color: colors.textPrimary }]}>
                      {repo.full_name}
                    </Text>
                    {isSelected && <Badge label="SELECTED" variant="brand" size="sm" />}
                  </View>
                  <Text style={[styles.repoMeta, { color: colors.textMuted }]}>
                    Branch: {repo.default_branch} • ⭐ {repo.stars_count} stars • {repo.primary_language}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Pick Repository Role */}
          {selectedRepo && (
            <View style={styles.roleSection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Assign Repository Role</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => {
                  const isRoleSelected = role === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      onPress={() => setRole(r.value)}
                      style={[
                        styles.roleChip,
                        {
                          backgroundColor: isRoleSelected ? colors.brand : colors.surfaceSubtle,
                          borderColor: isRoleSelected ? colors.brand : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.roleText, { color: isRoleSelected ? '#fff' : colors.textPrimary }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title={linking ? 'Linking...' : `Link ${selectedRepo.name}`}
                onPress={handleConfirmLink}
                loading={linking}
                variant="primary"
                style={styles.confirmBtn}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: '#27272A30',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  body: { padding: Spacing[5], paddingBottom: Spacing[10] },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[4],
  },
  repoList: { gap: Spacing[2], marginBottom: Spacing[4] },
  repoItem: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  repoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 4,
  },
  repoName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    flex: 1,
  },
  repoMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  roleSection: {
    marginTop: Spacing[2],
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  roleChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  roleText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  confirmBtn: { marginTop: Spacing[2] },
});

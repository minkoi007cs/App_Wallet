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
import { VercelProjectItem, LinkVercelInput } from '@/services/vercel';
import { Ionicons } from '@expo/vector-icons';

export function LinkVercelModal({
  visible,
  projectId,
  availableProjects,
  onClose,
  onLink,
}: {
  visible: boolean;
  projectId: string;
  availableProjects: VercelProjectItem[];
  onClose: () => void;
  onLink: (input: LinkVercelInput) => Promise<unknown>;
}) {
  const { colors } = useTheme();
  const [selectedProject, setSelectedProject] = useState<VercelProjectItem | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [search, setSearch] = useState('');
  const [linking, setLinking] = useState(false);

  const filteredProjects = availableProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmLink = async () => {
    if (!selectedProject) return;
    setLinking(true);
    try {
      await onLink({
        project_id: projectId,
        name: selectedProject.name,
        production_url: customUrl || selectedProject.production_url,
        latest_deployment_status: 'READY',
      });
      setSelectedProject(null);
      setCustomUrl('');
      onClose();
    } finally {
      setLinking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Link Vercel Project</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Select Vercel Project</Text>
          <RNTextInput
            style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Search Vercel projects..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.projectList}>
            {filteredProjects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <TouchableOpacity
                  key={proj.id}
                  onPress={() => {
                    setSelectedProject(proj);
                    setCustomUrl(proj.production_url);
                  }}
                  style={[
                    styles.projectItem,
                    {
                      backgroundColor: isSelected ? colors.surfaceSubtle : colors.surface,
                      borderColor: isSelected ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <Ionicons name="triangle-outline" size={18} color={colors.textPrimary} />
                    <Text style={[styles.projectName, { color: colors.textPrimary }]}>
                      {proj.name}
                    </Text>
                    {isSelected && <Badge label="SELECTED" variant="brand" size="sm" />}
                  </View>
                  <Text style={[styles.projectMeta, { color: colors.textMuted }]}>
                    {proj.production_url}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedProject && (
            <View style={styles.urlSection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Production URL</Text>
              <RNTextInput
                style={[styles.searchInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="https://your-app.vercel.app"
                placeholderTextColor={colors.textMuted}
              />

              <Button
                title={linking ? 'Linking...' : `Link ${selectedProject.name}`}
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
  projectList: { gap: Spacing[2], marginBottom: Spacing[4] },
  projectItem: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: 4,
  },
  projectName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
    flex: 1,
  },
  projectMeta: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
  },
  urlSection: {
    marginTop: Spacing[2],
  },
  confirmBtn: { marginTop: Spacing[2] },
});

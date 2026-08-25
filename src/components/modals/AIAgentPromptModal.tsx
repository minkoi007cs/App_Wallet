import React, { useState, useEffect, useCallback } from 'react';
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
import { useAgentPromptGenerator } from '@/hooks/useAIAssistant';
import { AIAgentPromptOptions } from '@/services/aiEngine';
import { Ionicons } from '@expo/vector-icons';

const AGENT_PRESETS: { label: string; value: AIAgentPromptOptions['agentType'] }[] = [
  { label: 'Google Antigravity', value: 'antigravity' },
  { label: 'Cursor AI', value: 'cursor' },
  { label: 'Windsurf Cascade', value: 'windsurf' },
  { label: 'Claude Code', value: 'claude_code' },
];

export function AIAgentPromptModal({
  visible,
  projectId,
  projectName,
  onClose,
}: {
  visible: boolean;
  projectId: string;
  projectName: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { promptText, generating, generatePrompt } = useAgentPromptGenerator(projectId);

  const [agentType, setAgentType] = useState<AIAgentPromptOptions['agentType']>('antigravity');
  const [customGoal, setCustomGoal] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    await generatePrompt({
      agentType,
      customGoal: customGoal.trim() || undefined,
    });
  }, [agentType, customGoal, generatePrompt]);

  useEffect(() => {
    if (visible && projectId) {
      handleGenerate();
    }
  }, [visible, projectId, handleGenerate]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Ionicons name="sparkles-outline" size={22} color={colors.brand} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Generate AI Agent Prompt
            </Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
            Target Project: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{projectName}</Text>
          </Text>

          {/* 1. Agent Preset Selector */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Select AI Agent</Text>
          <View style={styles.chipRow}>
            {AGENT_PRESETS.map((preset) => {
              const isSelected = agentType === preset.value;
              return (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => setAgentType(preset.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.brand : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. Custom Goal Input */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Custom Session Goal (Optional)</Text>
          <RNTextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="e.g. Implement user profile avatar upload & fix RLS policies"
            placeholderTextColor={colors.textMuted}
            value={customGoal}
            onChangeText={setCustomGoal}
          />

          <Button
            title={generating ? 'Generating Prompt...' : 'Refresh Prompt'}
            onPress={handleGenerate}
            loading={generating}
            variant="outline"
            size="sm"
            style={styles.refreshBtn}
            icon={<Ionicons name="refresh-outline" size={14} color={colors.textPrimary} />}
          />

          {/* 3. Formatted Prompt Output */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Generated Agent Prompt</Text>
          <View style={[styles.promptBox, { backgroundColor: '#18181B50', borderColor: colors.border }]}>
            <ScrollView style={{ maxHeight: 220 }}>
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                {promptText}
              </Text>
            </ScrollView>
          </View>

          <Button
            title={copied ? '✓ Prompt Copied to Clipboard!' : 'Copy Agent Prompt'}
            onPress={handleCopy}
            variant={copied ? 'outline' : 'primary'}
            style={styles.copyBtn}
            icon={<Ionicons name="copy-outline" size={16} color="#fff" />}
          />
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
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.sans,
  },
  body: { padding: Spacing[5], paddingBottom: Spacing[10] },
  subLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing[3],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.sans,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing[3],
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.sans,
    marginBottom: Spacing[3],
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing[3],
  },
  promptBox: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing[4],
  },
  promptText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.mono,
    lineHeight: 16,
  },
  copyBtn: { marginTop: Spacing[2] },
});

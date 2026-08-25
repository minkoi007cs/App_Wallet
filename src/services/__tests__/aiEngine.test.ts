import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAIAgentPrompt } from '../aiEngine';
import { ProjectWithDetails } from '../projects';

describe('AI Agent Prompt Generator Unit Tests', () => {
  const mockProject: ProjectWithDetails = {
    id: 'proj-ai-1',
    user_id: 'user-1',
    name: 'LifeDashboard',
    description: 'Personal life management dashboard',
    status: 'active',
    priority: 'high',
    progress: 70,
    start_date: '2026-01-01',
    target_date: '2026-10-31',
    tags: ['React', 'TypeScript'],
    health_status: 'healthy',
    health_reasons: ['Active commits recorded'],
    last_activity_at: new Date().toISOString(),
    frontend_url: 'https://lifedashboard.vercel.app',
    backend_url: null,
    supabase_url: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    repositories: [
      {
        id: 'repo-1',
        project_id: 'proj-ai-1',
        provider: 'github',
        external_id: 'gh-1',
        owner: 'minkoi007cs',
        name: 'lifedashboard',
        url: 'https://github.com/minkoi007cs/lifedashboard',
        role: 'frontend',
        default_branch: 'main',
        visibility: 'public',
        primary_language: 'TypeScript',
        stars_count: 3,
        forks_count: 0,
        open_issues_count: 1,
        latest_commit_sha: 'a1b2c3d',
        latest_commit_message: 'fix: update dashboard layout',
        latest_commit_author: 'Khoi Hoang',
        latest_commit_date: new Date().toISOString(),
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };

  it('generates structured prompt for Google Antigravity', async () => {
    const prompt = await generateAIAgentPrompt(mockProject, [], {
      agentType: 'antigravity',
      customGoal: 'Implement dark mode toggle',
    });
    assert.ok(prompt.includes('Google Antigravity AI Coding Agent'));
    assert.ok(prompt.includes('LifeDashboard'));
    assert.ok(prompt.includes('Implement dark mode toggle'));
  });

  it('generates structured prompt for Cursor AI', async () => {
    const prompt = await generateAIAgentPrompt(mockProject, [], {
      agentType: 'cursor',
    });
    assert.ok(prompt.includes('Cursor AI Agent'));
    assert.ok(prompt.includes('LifeDashboard'));
  });

  it('generates structured prompt for Windsurf Cascade', async () => {
    const prompt = await generateAIAgentPrompt(mockProject, [], {
      agentType: 'windsurf',
    });
    assert.ok(prompt.includes('Windsurf Cascade Agent'));
  });

  it('generates structured prompt for Claude Code', async () => {
    const prompt = await generateAIAgentPrompt(mockProject, [], {
      agentType: 'claude_code',
    });
    assert.ok(prompt.includes('Claude Code Agent'));
  });
});

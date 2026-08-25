import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeProjectHealth } from '../healthEngine';
import { ProjectWithDetails } from '../projects';

describe('Health Engine Diagnostic Unit Tests', () => {
  const baseProject: ProjectWithDetails = {
    id: 'test-p1',
    user_id: 'user-1',
    name: 'Test Project',
    description: 'Health test',
    status: 'active',
    priority: 'high',
    progress: 30,
    start_date: '2026-01-01',
    target_date: '2026-12-31',
    tags: ['TypeScript'],
    health_status: 'healthy',
    health_reasons: [],
    last_activity_at: new Date().toISOString(),
    frontend_url: null,
    backend_url: null,
    supabase_url: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('evaluates healthy when recent activity and linked repos exist', () => {
    const repos = [{ id: 'r1', name: 'repo' }];
    const tasks = [{ id: 't1', status: 'done', priority: 'medium' }];
    const res = computeProjectHealth(baseProject, tasks, repos, []);
    assert.equal(res.health_status, 'healthy');
  });

  it('detects missing repository on active project as needs_attention', () => {
    const res = computeProjectHealth(baseProject, [], [], []);
    assert.equal(res.health_status, 'needs_attention');
    assert.ok(res.health_reasons.some((r) => r.includes('No GitHub repository linked')));
  });

  it('detects overdue high priority tasks as critical', () => {
    const overdueTasks = [
      { id: 't1', status: 'todo', priority: 'critical', due_date: '2020-01-01' },
    ];
    const repos = [{ id: 'r1', name: 'repo' }];
    const res = computeProjectHealth(baseProject, overdueTasks, repos, []);
    assert.equal(res.health_status, 'critical');
    assert.ok(res.health_reasons.some((r) => r.includes('overdue')));
  });

  it('detects passed target date as critical', () => {
    const passedProject: ProjectWithDetails = {
      ...baseProject,
      target_date: '2020-01-01',
      progress: 40,
    };
    const repos = [{ id: 'r1', name: 'repo' }];
    const res = computeProjectHealth(passedProject, [], repos, []);
    assert.equal(res.health_status, 'critical');
    assert.ok(res.health_reasons.some((r) => r.includes('Target date passed')));
  });

  it('detects failed Vercel deployment as critical', () => {
    const integrations = [
      { provider: 'vercel', latest_deployment_status: 'ERROR', name: 'web' },
    ];
    const repos = [{ id: 'r1', name: 'repo' }];
    const res = computeProjectHealth(baseProject, [], repos, integrations);
    assert.equal(res.health_status, 'critical');
    assert.ok(res.health_reasons.some((r) => r.includes('Vercel deployment failed')));
  });
});

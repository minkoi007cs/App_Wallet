import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectInput, CreateProjectInput } from '../../lib/validation/project';

describe('Project Input Validation Unit Tests', () => {
  const validInput: CreateProjectInput = {
    name: 'App Wallet',
    description: 'Developer Command Center',
    status: 'active',
    priority: 'high',
    progress: 50,
    start_date: '2026-01-01',
    target_date: '2026-12-31',
    tags: ['TypeScript'],
    frontend_url: 'https://my-app.vercel.app',
    backend_url: 'https://api.my-app.com',
    supabase_url: 'https://supabase.com/dashboard/project/123',
  };

  it('passes validation for valid inputs', () => {
    const res = validateProjectInput(validInput);
    assert.equal(res.isValid, true);
    assert.equal(Object.keys(res.errors).length, 0);
  });

  it('fails when project name is empty or too short', () => {
    const res = validateProjectInput({ ...validInput, name: ' ' });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.name);
  });

  it('fails when progress is out of 0-100 range', () => {
    const res = validateProjectInput({ ...validInput, progress: 150 });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.progress);
  });

  it('fails when target date is before start date', () => {
    const res = validateProjectInput({
      ...validInput,
      start_date: '2026-12-31',
      target_date: '2026-01-01',
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.target_date);
  });

  it('fails when deployment URL is malformed', () => {
    const res = validateProjectInput({
      ...validInput,
      frontend_url: 'not-a-valid-url',
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.frontend_url);
  });
});

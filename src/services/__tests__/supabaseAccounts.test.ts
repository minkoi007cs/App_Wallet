import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSupabaseAccounts,
  addManualSupabaseProject,
  getAllManagedSupabaseProjects,
  removeSupabaseAccount,
} from '../supabaseAccounts';

describe('Multi-Account Supabase Management Unit Tests', () => {
  it('initializes default Supabase account list', () => {
    const accounts = getSupabaseAccounts();
    assert.ok(Array.isArray(accounts));
    assert.ok(accounts.length > 0);
    assert.equal(accounts[0].emailLabel, 'minkoi007.cs@gmail.com');
  });

  it('manually registers a project under an account', () => {
    const project = addManualSupabaseProject(
      'second.account@gmail.com',
      'House Renting DB',
      'lnuijfoohwvunatwuqjx'
    );
    assert.equal(project.id, 'lnuijfoohwvunatwuqjx');
    assert.equal(project.url, 'https://lnuijfoohwvunatwuqjx.supabase.co');
    assert.equal(project.accountEmail, 'second.account@gmail.com');

    const all = getAllManagedSupabaseProjects();
    const found = all.find((p) => p.id === 'lnuijfoohwvunatwuqjx');
    assert.ok(found);
    assert.equal(found.accountEmail, 'second.account@gmail.com');
  });

  it('flattens all managed projects across all Gmail accounts', () => {
    const all = getAllManagedSupabaseProjects();
    assert.ok(all.length >= 2);
    assert.ok(all.some((p) => p.accountEmail.includes('minkoi007.cs')));
    assert.ok(all.some((p) => p.accountEmail.includes('second.account')));
  });

  it('removes an account correctly', () => {
    const accountsBefore = getSupabaseAccounts();
    const target = accountsBefore.find((a) => a.emailLabel === 'second.account@gmail.com');
    if (target) {
      removeSupabaseAccount(target.id);
      const accountsAfter = getSupabaseAccounts();
      assert.ok(!accountsAfter.some((a) => a.id === target.id));
    }
  });
});

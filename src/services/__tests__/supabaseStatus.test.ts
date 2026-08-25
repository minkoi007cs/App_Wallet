import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSupabaseRef,
  normalizeSupabaseApiUrl,
  getSupabaseDashboardUrl,
  checkSupabaseHealth,
} from '../supabaseStatus';

describe('Supabase Health Status & Parser Unit Tests', () => {
  it('extracts ref from standard API url', () => {
    const ref = extractSupabaseRef('https://ymunwzjmemxifjxsiugz.supabase.co');
    assert.equal(ref, 'ymunwzjmemxifjxsiugz');
  });

  it('extracts ref from dashboard console url', () => {
    const ref = extractSupabaseRef('https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz');
    assert.equal(ref, 'ymunwzjmemxifjxsiugz');
  });

  it('extracts ref from plain string ref', () => {
    const ref = extractSupabaseRef('ymunwzjmemxifjxsiugz');
    assert.equal(ref, 'ymunwzjmemxifjxsiugz');
  });

  it('returns null for empty or invalid inputs', () => {
    assert.equal(extractSupabaseRef(null), null);
    assert.equal(extractSupabaseRef(undefined), null);
    assert.equal(extractSupabaseRef(''), null);
    assert.equal(extractSupabaseRef('not-a-supabase-link'), null);
  });

  it('normalizes canonical API URL', () => {
    const apiUrl = normalizeSupabaseApiUrl('https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz');
    assert.equal(apiUrl, 'https://ymunwzjmemxifjxsiugz.supabase.co');
  });

  it('generates standard Supabase dashboard console link', () => {
    const dashboardUrl = getSupabaseDashboardUrl('https://ymunwzjmemxifjxsiugz.supabase.co');
    assert.equal(dashboardUrl, 'https://supabase.com/dashboard/project/ymunwzjmemxifjxsiugz');
  });

  it('returns unconfigured status when URL is null or empty', async () => {
    const res = await checkSupabaseHealth(null);
    assert.equal(res.status, 'unconfigured');
    assert.equal(res.ref, null);
  });
});

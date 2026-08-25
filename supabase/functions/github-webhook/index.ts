// Supabase Edge Function: github-webhook
// Ingests real-time GitHub push, pull request, and issue events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- HMAC-SHA256 signature verification ---
async function verifySignature(req: Request, body: string): Promise<boolean> {
  const secret = Deno.env.get('GITHUB_WEBHOOK_SECRET');
  if (!secret) {
    return false;
  }

  const signatureHeader = req.headers.get('x-hub-signature-256');
  if (!signatureHeader) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = 'sha256=' + Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (signatureHeader.length !== expectedHex.length) {
    return false;
  }
  const a = encoder.encode(signatureHeader);
  const b = encoder.encode(expectedHex);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

serve(async (req) => {
  try {
    // Read body as text for signature verification, then parse as JSON
    const bodyText = await req.text();

    const isValid = await verifySignature(req, bodyText);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const eventType = req.headers.get('x-github-event') || 'unknown';
    const payload = JSON.parse(bodyText);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const repositoryName = payload.repository?.name;
    const repositoryOwner = payload.repository?.owner?.login;

    if (!repositoryName || !repositoryOwner) {
      return new Response(JSON.stringify({ message: 'Ignored: No repository info' }), { status: 200 });
    }

    // 1. Find matched repository in project_repositories
    const { data: repos } = await supabase
      .from('project_repositories')
      .select('id, project_id')
      .eq('owner', repositoryOwner)
      .eq('name', repositoryName);

    if (!repos || repos.length === 0) {
      return new Response(JSON.stringify({ message: 'No linked project found for repository' }), { status: 200 });
    }

    // 2. Handle event types — process ALL matching repos, not just the first
    for (const linkedRepo of repos) {
      if (eventType === 'push') {
        const headCommit = payload.head_commit;
        if (headCommit) {
          // Update project repository commit info
          await supabase
            .from('project_repositories')
            .update({
              latest_commit_sha: headCommit.id?.substring(0, 7),
              latest_commit_message: headCommit.message,
              latest_commit_author: headCommit.author?.name,
              latest_commit_date: headCommit.timestamp,
              updated_at: new Date().toISOString(),
            })
            .eq('id', linkedRepo.id);

          // Update project last activity date (no health_status override)
          await supabase
            .from('projects')
            .update({
              last_activity_at: new Date().toISOString(),
            })
            .eq('id', linkedRepo.project_id);

          // Insert activity event
          await supabase.from('activity_events').insert({
            project_id: linkedRepo.project_id,
            event_type: 'github_commit',
            title: `Commit to ${repositoryOwner}/${repositoryName}`,
            description: headCommit.message,
            metadata: {
              sha: headCommit.id?.substring(0, 7),
              author: headCommit.author?.name,
              url: headCommit.url,
              branch: payload.ref?.replace('refs/heads/', ''),
            },
          });
        }
      } else if (eventType === 'pull_request') {
        const pr = payload.pull_request;
        await supabase.from('activity_events').insert({
          project_id: linkedRepo.project_id,
          event_type: 'github_pr',
          title: `PR ${payload.action}: #${pr.number} ${pr.title}`,
          description: pr.body || '',
          metadata: {
            number: pr.number,
            state: pr.state,
            url: pr.html_url,
            user: pr.user?.login,
          },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: eventType }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

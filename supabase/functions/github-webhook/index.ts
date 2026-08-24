// Supabase Edge Function: github-webhook
// Ingests real-time GitHub push, pull request, and issue events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const eventType = req.headers.get('x-github-event') || 'unknown';
    const payload = await req.json();

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

    const linkedRepo = repos[0];

    // 2. Handle event types
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

        // Update project last activity date & health status
        await supabase
          .from('projects')
          .update({
            last_activity_at: new Date().toISOString(),
            health_status: 'healthy',
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

    return new Response(JSON.stringify({ success: true, processed: eventType }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

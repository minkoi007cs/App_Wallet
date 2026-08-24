// Supabase Edge Function: vercel-sync
// Secret-isolated proxy for Vercel REST API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERCEL_TOKEN = Deno.env.get('VERCEL_AUTH_TOKEN') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, project_id, vercel_project_name } = await req.json();

    if (action === 'list_projects') {
      const res = await fetch('https://api.vercel.com/v9/projects', {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      });
      const data = await res.json();
      return new Response(JSON.stringify({ projects: data.projects || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_latest_deployment' && vercel_project_name) {
      const res = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${vercel_project_name}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        }
      );
      const data = await res.json();
      const latest = data.deployments?.[0];
      return new Response(
        JSON.stringify({
          deployment: latest
            ? {
                id: latest.uid,
                url: `https://${latest.url}`,
                state: latest.state, // READY, BUILDING, ERROR, CANCELED
                created_at: new Date(latest.created).toISOString(),
              }
            : null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

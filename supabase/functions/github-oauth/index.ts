// Supabase Edge Function: github-oauth
// Securely exchanges OAuth code for access token using client secret

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GITHUB_CLIENT_ID = Deno.env.get('GITHUB_CLIENT_ID') || '';
const GITHUB_CLIENT_SECRET = Deno.env.get('GITHUB_CLIENT_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'OAuth code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Exchange code for access token with GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData.error_description || 'GitHub OAuth exchange failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        'User-Agent': 'App-Wallet-Agent',
      },
    });

    const ghUser = await userResponse.json();

    // 3. Authenticate Supabase user and store in external_accounts table
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenUser = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!tokenUser.data?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = tokenUser.data.user.id;
    await supabase.from('external_accounts').upsert({
      user_id: userId,
      provider: 'github',
      account_id: String(ghUser.id),
      account_name: ghUser.login,
      access_token_encrypted: accessToken,
      metadata: {
        avatar_url: ghUser.avatar_url,
        html_url: ghUser.html_url,
        public_repos: ghUser.public_repos,
      },
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: ghUser.id,
          username: ghUser.login,
          name: ghUser.name,
          avatar_url: ghUser.avatar_url,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

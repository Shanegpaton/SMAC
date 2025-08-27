import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-api-key, x-cron-key, authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for cron key
    const cronKey = req.headers.get('x-cron-key');
    if (!cronKey || cronKey !== Deno.env.get('CRON_SECRET_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Invalid cron key' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if distribution is active
    const { data: distribution, error: distributionError } = await supabaseClient
      .from('SMACCoinsDistribution')
      .select('*')
      .single();

    if (distributionError) {
      throw distributionError;
    }

    if (!distribution?.isActive) {
      return new Response(
        JSON.stringify({ message: 'Distribution is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if enough time has passed (1 minute for testing)
    const now = new Date();
    const lastDistributed = new Date(distribution.lastDistributed);
    const timeSinceLastDistribution = now.getTime() - lastDistributed.getTime();
    const oneMinute = 60 * 1000;

    if (timeSinceLastDistribution < oneMinute) {
      return new Response(
        JSON.stringify({
          message: 'Not enough time has passed',
          nextDistribution: new Date(lastDistributed.getTime() + oneMinute)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, email, smacCoins');

    if (usersError) {
      throw usersError;
    }

    // Update each user's SMAC coins
    const updatePromises = users.map(async (user) => {
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ smacCoins: user.smacCoins + distribution.weeklyAmount })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      return {
        email: user.email,
        oldBalance: user.smacCoins,
        newBalance: user.smacCoins + distribution.weeklyAmount
      };
    });

    const updatedUsers = await Promise.all(updatePromises);

    // Update last distributed timestamp
    const { error: updateError } = await supabaseClient
      .from('SMACCoinsDistribution')
      .update({ lastDistributed: now.toISOString() })
      .eq('id', distribution.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: 'Distribution successful',
        usersUpdated: users.length,
        updatedUsers,
        nextDistribution: new Date(now.getTime() + oneMinute)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 
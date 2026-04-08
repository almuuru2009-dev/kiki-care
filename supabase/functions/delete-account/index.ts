import { createClient } from '@supabase/supabase-js'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Get user from JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to delete all user data
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const userId = user.id

    // Delete in order to respect dependencies
    await adminClient.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    await adminClient.from('treatment_plans').delete().eq('therapist_id', userId)
    await adminClient.from('sessions').delete().eq('caregiver_id', userId)
    await adminClient.from('saved_exercises').delete().eq('user_id', userId)
    await adminClient.from('medals').delete().eq('user_id', userId)
    await adminClient.from('user_points').delete().eq('user_id', userId)
    await adminClient.from('user_settings').delete().eq('user_id', userId)
    await adminClient.from('notifications').delete().eq('user_id', userId)
    await adminClient.from('feedback').delete().eq('user_id', userId)
    await adminClient.from('exercises').delete().eq('created_by', userId)
    await adminClient.from('therapist_caregiver_links').delete().or(`therapist_id.eq.${userId},caregiver_id.eq.${userId}`)
    await adminClient.from('children').delete().eq('caregiver_id', userId)
    await adminClient.from('profiles').delete().eq('id', userId)

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

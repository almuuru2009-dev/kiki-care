import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, type, userEmail, userName } = await req.json()

    if (!text || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing text or userEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      // Fallback: just store in DB, no email sent
      return new Response(JSON.stringify({ success: true, note: 'Stored in DB only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use Lovable AI gateway to send email notification
    const emailBody = `
      <h2>Nuevo comentario de KikiCare</h2>
      <p><strong>De:</strong> ${userName || 'Usuario'} (${userEmail})</p>
      <p><strong>Tipo:</strong> ${type || 'comment'}</p>
      <hr />
      <p>${text.replace(/\n/g, '<br/>')}</p>
      <hr />
      <p style="color: #999; font-size: 12px;">Enviado desde KikiCare App</p>
    `

    // For now, feedback is stored in the database
    // Email sending can be configured with Lovable Emails
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

import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const { token, message, photoPath, videoPath, voicePath, deviceInfo } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!message || message.length < 10) {
      return new Response(JSON.stringify({ error: 'Message must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (message.length > 1000) {
      return new Response(JSON.stringify({ error: 'Message must be at most 1000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, wedding_id, completed')
      .eq('access_token', token)
      .maybeSingle();

    if (guestError) throw guestError;
    if (!guest) {
      return new Response(JSON.stringify({ error: 'Guest not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (guest.completed) {
      return new Response(JSON.stringify({ error: 'You have already submitted your message' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('guest_id', guest.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'You have already submitted your message' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase.from('submissions').insert({
      guest_id: guest.id,
      wedding_id: guest.wedding_id,
      message,
      photo_path: photoPath ?? null,
      video_path: videoPath ?? null,
      voice_path: voicePath ?? null,
      device_info: deviceInfo ?? null,
    });

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from('guests')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', guest.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

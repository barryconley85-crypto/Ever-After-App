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

    let slug: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json();
      slug = body.slug ?? null;
    } else {
      const url = new URL(req.url);
      slug = url.searchParams.get('slug');
    }

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing slug' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: wedding, error: wError } = await supabase
      .from('weddings')
      .select('id, couple_display_name')
      .eq('guest_slug', slug)
      .maybeSingle();

    if (wError) throw wError;
    if (!wedding) {
      return new Response(JSON.stringify({ error: 'Wedding not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs, error: sError } = await supabase
      .from('submissions')
      .select(`
        id,
        message,
        photo_path,
        submitted_at,
        guests (first_name, last_name)
      `)
      .eq('wedding_id', wedding.id)
      .order('submitted_at', { ascending: false });

    if (sError) throw sError;

    const slides = (subs as unknown as Array<{
      id: string;
      message: string;
      photo_path: string | null;
      submitted_at: string;
      guests: { first_name: string; last_name: string } | null;
    }>).map(s => ({
      id: s.id,
      guestName: s.guests ? `${s.guests.first_name} ${s.guests.last_name}` : 'Guest',
      message: s.message,
      photoPath: s.photo_path,
      submittedAt: s.submitted_at,
    })).filter(s => s.photoPath);

    return new Response(JSON.stringify({
      wedding: { id: wedding.id, couple_display_name: wedding.couple_display_name },
      slides,
    }), {
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

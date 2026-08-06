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
      .select('id, couple_display_name, welcome_message')
      .eq('guest_slug', slug)
      .maybeSingle();

    if (wError) throw wError;
    if (!wedding) {
      return new Response(JSON.stringify({ error: 'Wedding not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: guests, error: gError } = await supabase
      .from('guests')
      .select('id, first_name, last_name, access_token, completed')
      .eq('wedding_id', wedding.id)
      .order('first_name');

    if (gError) throw gError;

    return new Response(JSON.stringify({
      wedding: {
        couple_display_name: wedding.couple_display_name,
        welcome_message: wedding.welcome_message,
      },
      guests: guests ?? [],
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

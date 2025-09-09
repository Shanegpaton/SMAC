import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cronKey = process.env.CRON_SECRET_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    if (!cronKey) {
      return NextResponse.json(
        { error: 'Missing env: CRON_SECRET_KEY' },
        { status: 500 }
      );
    }

    const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/distribute-coins`;
    console.log('Calling Supabase function:', url);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'x-api-key': serviceKey,
        'x-cron-key': cronKey,
      }
    });

    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response text:', text);
    // Try to parse as JSON, fall back to raw text
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: res.status });
    } catch {
      return NextResponse.json({ raw: text }, { status: res.status });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

// Vercel Cron issues GET requests by default; keep GET handler.
// You can also manually hit this route in the browser to verify JSON output.


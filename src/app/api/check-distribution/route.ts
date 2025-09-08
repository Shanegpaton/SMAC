import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseUrl = process.env.SUPABASE_FUNCTIONS_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!baseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing env: SUPABASE_FUNCTIONS_URL or SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/distribute-coins/check-run`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
      }
    });

    const text = await res.text();
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


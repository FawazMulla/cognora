import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth routes and public routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Only protect /api routes for now
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('sb-access-token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  // Use Supabase client to validate token
  const supabase = createClient(
    process.env['SUPABASE_URL'] || '',
    process.env['SUPABASE_ANON_KEY'] || '',
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const authId = user.id;

  // Fetch the public.users id mapping via Supabase REST API (since we are on Edge runtime)
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (dbError || !userData) {
    return NextResponse.json({ error: 'Unauthorized: User not found in database' }, { status: 401 });
  }

  const userId = userData.id;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-auth-id', authId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};

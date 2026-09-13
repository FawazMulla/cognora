import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function addCorsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin') || '*';
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-auth-id, x-api-key, x-cohere-key, x-preferred-provider, sb-access-token',
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS preflight options requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(request, response);
  }

  const wrapResponse = (response: NextResponse) => {
    return addCorsHeaders(request, response);
  };

  // Skip auth routes and public routes
  if (pathname.startsWith('/api/auth') || pathname === '/api/health') {
    return wrapResponse(NextResponse.next());
  }

  // Serve the SPA frontend for non-API routes at runtime
  if (!pathname.startsWith('/api')) {
    return wrapResponse(NextResponse.rewrite(new URL('/_spa.html', request.url)));
  }

  const accessToken =
    request.cookies.get('sb-access-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!accessToken) {
    console.warn('Middleware auth check failed: Missing token');
    return wrapResponse(
      NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 }),
    );
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
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn('Middleware auth check failed: Invalid token error:', authError);
    return wrapResponse(
      NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 }),
    );
  }

  const authId = user.id;

  // Fetch the public.users id mapping using the admin client to bypass RLS
  const supabaseAdmin = createClient(
    process.env['SUPABASE_URL'] || '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data: userData, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (dbError || !userData) {
    console.warn(
      'Middleware auth check failed: User not found in database error:',
      dbError,
      'userData:',
      userData,
    );
    return wrapResponse(
      NextResponse.json({ error: 'Unauthorized: User not found in database' }, { status: 401 }),
    );
  }

  const userId = userData.id;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-auth-id', authId);

  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return wrapResponse(nextResponse);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|assets|favicon\\.ico|_spa\\.html|.*\\..*).*)',
  ],
};

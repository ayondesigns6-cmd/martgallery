import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const { pathname } = req.nextUrl;

  // Allow the login page and static assets through without protection
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return res;
  }

  // Verify Supabase public environment variables
  if (!isSupabaseConfigured()) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('error', 'missing_env');
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options ?? {})
        );
      },
    },
  });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Verify service-role key is configured
    if (!isAdminConfigured()) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'missing_service_key');
      return NextResponse.redirect(loginUrl);
    }

    // Verify the authenticated user is in the admin_users table
    const adminClient = createAdminClient();
    const { data: adminUser, error: adminErr } = await (adminClient.from('admin_users') as any)
      .select('id, email')
      .or(`id.eq.${user.id},email.ilike.${user.email}`)
      .maybeSingle();

    if (adminErr || !adminUser) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'not_in_admin_users');
      loginUrl.searchParams.set('email', user.email ?? '');
      loginUrl.searchParams.set('uid', user.id ?? '');
      return NextResponse.redirect(loginUrl);
    }

    // Auto-sync user ID if matched by email
    if (adminUser.id !== user.id && user.email) {
      await (adminClient.from('admin_users') as any)
        .update({ id: user.id })
        .eq('email', user.email);
    }
  } catch (err) {
    console.error('[Middleware] Admin auth error:', err);
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Only protect /admin/* (except /admin/login)
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return res;
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Verify the user is in admin_users table
    const adminClient = createAdminClient();
    const { data: adminUser } = await (adminClient.from('admin_users') as any)
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};

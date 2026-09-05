import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function verifyAdmin(): Promise<{
  isAdmin: boolean;
  user?: any;
  response?: NextResponse;
  adminClient?: any;
  error?: string;
  sqlFix?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        { error: 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing.' },
        { status: 500 }
      ),
      error: 'Supabase environment variables are missing',
    };
  }

  if (!isAdminConfigured()) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server.' },
        { status: 500 }
      ),
      error: 'SUPABASE_SERVICE_ROLE_KEY is missing on the server',
    };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        isAdmin: false,
        response: NextResponse.json({ error: 'Unauthorized: No valid session found.' }, { status: 401 }),
        error: userError?.message || 'No active session found',
      };
    }

    const adminClient = createAdminClient();
    const { data: adminUser, error: adminQueryErr } = await (adminClient.from('admin_users') as any)
      .select('id, email')
      .or(`id.eq.${user.id},email.ilike.${user.email}`)
      .maybeSingle();

    if (adminQueryErr || !adminUser) {
      const sqlFix = `INSERT INTO public.admin_users (id, email)\nVALUES ('${user.id}', '${user.email}')\nON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;`;
      return {
        isAdmin: false,
        user,
        response: NextResponse.json(
          {
            error: `User "${user.email}" is authenticated in Supabase Auth, but not registered in the public.admin_users table.`,
            sqlFix,
          },
          { status: 403 }
        ),
        error: `User "${user.email}" is not registered in the admin_users table.`,
        sqlFix,
      };
    }

    // Auto-sync user ID if matched by email but ID is outdated
    if (adminUser.id !== user.id && user.email) {
      await (adminClient.from('admin_users') as any)
        .update({ id: user.id })
        .eq('email', user.email);
    }

    return { isAdmin: true, user, adminClient };
  } catch (err: any) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        { error: err?.message || 'Authentication verification failed.' },
        { status: 500 }
      ),
      error: err?.message || 'Authentication verification failed',
    };
  }
}

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function verifyAdmin(): Promise<{ isAdmin: boolean; response?: NextResponse; adminClient?: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const adminClient = createAdminClient();
    const { data: adminUser } = await (adminClient.from('admin_users') as any)
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return { isAdmin: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { isAdmin: true, adminClient };
  } catch {
    return { isAdmin: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

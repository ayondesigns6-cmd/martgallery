import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/admin-auth';

export async function POST() {
  const result = await verifyAdmin();

  if (!result.isAdmin) {
    return NextResponse.json(
      {
        success: false,
        isAdmin: false,
        error: result.error || 'User does not have admin permissions.',
        sqlFix: result.sqlFix || null,
      },
      { status: result.response?.status || 403 }
    );
  }

  return NextResponse.json({
    success: true,
    isAdmin: true,
    user: {
      id: result.user?.id,
      email: result.user?.email,
    },
  });
}

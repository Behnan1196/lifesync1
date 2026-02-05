import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabaseService';

export async function GET(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceRoleClient();
    const { data: { users }, error } = await serviceClient.auth.admin.listUsers();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to simple structure
    const result = users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
    }));

    return NextResponse.json(result);
}

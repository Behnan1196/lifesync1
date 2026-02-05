import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, organization_id } = await req.json();

    if (!email || !organization_id) {
        return NextResponse.json({ error: 'email and organization_id are required' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase.rpc('remove_organization_member_by_email', {
        p_organization_id: organization_id,
        p_member_email: email
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

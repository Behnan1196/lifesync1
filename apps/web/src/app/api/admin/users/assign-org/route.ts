import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, organization_id, role } = await req.json();

    if (!email || !organization_id || !role) {
        return NextResponse.json({ error: 'email, organization_id and role are required' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase.rpc('add_organization_member_by_email', {
        p_organization_id: organization_id,
        p_member_email: email,
        p_role: role
    });

    if (error) {
        // Check for owner conflict
        if (error.message.includes('Owner already exists') || error.message.includes('owner')) {
            return NextResponse.json({ error: 'This operation conflicts with organization ownership. Ownership cannot be changed here.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

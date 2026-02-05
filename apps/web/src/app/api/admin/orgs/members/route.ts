import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get('org_id');

    if (!org_id) {
        return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('list_organization_members', {
        p_organization_id: org_id
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

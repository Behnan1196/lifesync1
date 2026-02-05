import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc('create_organization', {
        p_name: name
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organization_id: data });
}

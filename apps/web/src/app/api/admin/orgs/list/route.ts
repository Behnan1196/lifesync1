import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

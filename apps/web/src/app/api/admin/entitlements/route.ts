import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { getStore } from '@/lib/entitlements';

export async function GET(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    const store = getStore();

    if (user_id) {
        const override = store.overrides[user_id];
        return NextResponse.json(override ? override.tools : []);
    }

    return NextResponse.json(store);
}

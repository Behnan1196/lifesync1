import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { getStore, saveStore } from '@/lib/entitlements';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json();

    if (!user_id) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const store = getStore();
    delete store.overrides[user_id];

    saveStore(store);

    return NextResponse.json({ ok: true });
}

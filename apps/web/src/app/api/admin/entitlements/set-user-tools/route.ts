import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { getStore, saveStore } from '@/lib/entitlements';
import { ASSIGNABLE_TOOLS } from '@/workbench/registry';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, tools } = await req.json();

    if (!user_id || !Array.isArray(tools)) {
        return NextResponse.json({ error: 'user_id and tools array are required' }, { status: 400 });
    }

    // Validate tools against registry
    const validTools = tools.filter(t => ASSIGNABLE_TOOLS.includes(t));

    const store = getStore();
    store.overrides[user_id] = { tools: validTools };

    saveStore(store);

    return NextResponse.json({ ok: true });
}

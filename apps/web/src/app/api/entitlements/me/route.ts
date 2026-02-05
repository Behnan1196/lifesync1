import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    let user;
    if (token) {
        const { data: { user: u }, error } = await supabase.auth.getUser(token);
        if (!error) user = u;
    } else {
        const { data: { user: u } } = await supabase.auth.getUser();
        user = u;
    }

    if (!user) {
        return NextResponse.json({ entitlements: [] }, { status: 401 });
    }

    const { getStore } = await import('@/lib/entitlements');
    const store = getStore();

    const userOverrides = store.overrides[user.id];
    const entitlements = userOverrides ? userOverrides.tools : store.defaults.tools;

    return NextResponse.json({ entitlements });
}

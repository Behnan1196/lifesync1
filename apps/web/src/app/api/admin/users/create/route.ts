import { NextRequest, NextResponse } from 'next/server';
import { verifySuperAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabaseService';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    if (!await verifySuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, password, full_name, phone, birth_date, organization_id, role } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const serviceClient = createServiceRoleClient();

    // 1) Create auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2) Upsert user directory
    const supabase = createClient();
    const { error: dirError } = await supabase.rpc('upsert_user_directory_by_email', {
        p_email: email,
        p_full_name: full_name || null,
        p_phone: phone || null,
        p_birth_date: birth_date || null
    });

    if (dirError) {
        // Note: We don't rollback auth user creation for simplicity/SÖK-TAK rules 
        // but in a real app you might want to.
        return NextResponse.json({ error: dirError.message }, { status: 500 });
    }

    // 3) Optional org assignment
    if (organization_id && role) {
        const { error: memberError } = await supabase.rpc('add_organization_member_by_email', {
            p_organization_id: organization_id,
            p_member_email: email,
            p_role: role
        });

        if (memberError) {
            return NextResponse.json({
                message: 'User created but org assignment failed',
                error: memberError.message
            }, { status: 207 });
        }
    }

    return NextResponse.json({ user_id: userId });
}

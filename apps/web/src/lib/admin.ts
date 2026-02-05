import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function verifySuperAdmin() {
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return false;

    const superAdminEmails = (process.env.LIFESYNC_SUPERADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    return superAdminEmails.includes(user.email.toLowerCase());
}

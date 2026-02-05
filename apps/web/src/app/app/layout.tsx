import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    if (!user) {
        redirect("/login");
    }

    const superAdminEmails = (process.env.LIFESYNC_SUPERADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const isSuperAdmin = user.email ? superAdminEmails.includes(user.email.toLowerCase()) : false;

    return (
        <AppShell isSuperAdmin={isSuperAdmin}>
            {children}
        </AppShell>
    );
}

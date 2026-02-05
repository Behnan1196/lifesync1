import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LifeSync",
    description: "LifeSync Web Frame",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: any) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }: any) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const superAdminEmails = (process.env.LIFESYNC_SUPERADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const isSuperAdmin = user?.email ? superAdminEmails.includes(user.email.toLowerCase()) : false;

    return (
        <html lang="en">
            <body className={inter.className}>
                <LanguageProvider>
                    <AuthProvider>
                        <OrganizationProvider>
                            <WorkspaceProvider>
                                {/* 
                  We pass isSuperAdmin via a special prop or context if needed, 
                  but user said: "Pass isSuperAdmin to AppShell and Sidebar as prop"
                  Since AppShell is probably in /app/app/layout.tsx, we can't pass it directly here 
                  unless we use a Top Level layout or something.
                  I'll use a Client Component to hold this state or just fetch it in the sub-layout.
                */}
                                {children}
                            </WorkspaceProvider>
                        </OrganizationProvider>
                    </AuthProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}

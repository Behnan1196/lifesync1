"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const setData = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (userError || sessionError) {
                setLoading(false);
                return;
            }

            setSession(session);
            setUser(user);

            if (session?.user) {
                // Fetch role from public.profiles
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single();

                if (profileError) {
                    if (profileError.code === 'PGRST116') { // Row missing
                        setRole('user');
                    } else {
                        console.error('Error fetching profile:', profileError);
                        router.push('/setup-incomplete');
                    }
                } else {
                    setRole(profile.role || 'user');
                }
            }
            setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                setData();
            } else {
                setRole(null);
                if (pathname.startsWith('/app')) {
                    router.push('/login');
                }
            }
        });

        setData();

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Workspace from './Workspace';
import ProfileDrawer from './ProfileDrawer';
import { useWorkspace } from '@/context/WorkspaceContext';
import styles from './shell.module.css';
import sidebarStyles from './sidebar.module.css';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';

interface AppShellProps {
    children: React.ReactNode;
    isSuperAdmin: boolean;
}

export default function AppShell({ children, isSuperAdmin }: AppShellProps) {
    const { t } = useLanguage();
    const { organizationId, setOrganizationId } = useOrganization();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [entitlements, setEntitlementsLocal] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const supabase = createClient();
    const { setEntitlements, setSuperAdmin } = useWorkspace();

    useEffect(() => {
        setSuperAdmin(isSuperAdmin);
    }, [isSuperAdmin, setSuperAdmin]);

    useEffect(() => {
        const fetchOrgs = async () => {
            const { data } = await supabase
                .from('organizations')
                .select('id, name');
            if (data) setOrganizations(data);
        };
        fetchOrgs();
    }, [supabase]);

    useEffect(() => {
        const fetchEntitlements = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const response = await fetch('/api/entitlements/me');
                if (response.ok) {
                    const data = await response.json();
                    const ents = data.entitlements || [];
                    setEntitlementsLocal(ents);
                    setEntitlements(ents);
                }
            } catch (err) {
                console.error('Failed to fetch entitlements', err);
                setEntitlementsLocal([]);
                setEntitlements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEntitlements();
    }, [supabase, setEntitlements]);

    return (
        <div className={styles.shell}>
            <Sidebar
                isSuperAdmin={isSuperAdmin}
                entitlements={entitlements}
                onProfileClick={() => setIsProfileOpen(true)}
            />
            <main className={styles.main}>
                <header className={sidebarStyles.mobileTopBar}>
                    <Link href="/app" className={sidebarStyles.logo} style={{ display: 'block' }}>LifeSync</Link>
                    <select
                        value={organizationId || ""}
                        onChange={(e) => setOrganizationId(e.target.value || null)}
                        className={sidebarStyles.orgSelect}
                        style={{ width: 'auto', minWidth: '120px' }}
                    >
                        <option value="">{t.sidebar.noOrg}</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </header>
                {children}
            </main>
            <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
    );
}

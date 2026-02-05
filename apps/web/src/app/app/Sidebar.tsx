"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { TOOLS_REGISTRY, ASSIGNABLE_TOOLS } from '@/workbench/registry';
import * as Icons from 'lucide-react';
import styles from './sidebar.module.css';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface SidebarProps {
    isSuperAdmin: boolean;
    entitlements: string[];
    onProfileClick: () => void;
}

export default function Sidebar({ isSuperAdmin, entitlements, onProfileClick }: SidebarProps) {
    const { t } = useLanguage();
    const { organizationId, setOrganizationId } = useOrganization();
    const { openPanel, slots } = useWorkspace();
    const { signOut } = useAuth();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchOrgs = async () => {
            const { data } = await supabase
                .from('organizations')
                .select('id, name');
            if (data) setOrganizations(data);
        };
        fetchOrgs();
    }, [supabase]);

    const handleToolClick = (toolId: string) => {
        if (pathname !== '/app') {
            router.push('/app');
        }
        openPanel(toolId);
    };

    // Determine visible tools
    const visibleToolIds = new Set<string>();
    visibleToolIds.add('tools'); // Always show launcher

    if (isSuperAdmin) {
        visibleToolIds.add('superadmin');
        ASSIGNABLE_TOOLS.forEach(id => visibleToolIds.add(id));
    } else {
        entitlements.forEach(id => {
            if (TOOLS_REGISTRY[id]) visibleToolIds.add(id);
        });
    }

    const mobileButtons = [
        { id: 'agenda', icon: 'Calendar' },
        { id: 'habit', icon: 'CheckCircle' },
        { id: 'comm', icon: 'MessageSquare' },
        { id: 'tools', icon: 'Grid' },
    ];

    return (
        <aside className={styles.sidebar}>
            {/* Desktop Section */}
            <div className={`${styles.top} ${styles.desktopOnly}`}>
                <Link href="/app" className={styles.logo}>LifeSync</Link>

                <div className={styles.section}>
                    <label>{t.sidebar.organizations}</label>
                    <select
                        value={organizationId || ""}
                        onChange={(e) => setOrganizationId(e.target.value || null)}
                        className={styles.orgSelect}
                    >
                        <option value="">{t.sidebar.noOrg}</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                </div>

                <nav className={styles.nav}>
                    <label>{t.sidebar.tools}</label>
                    <div className={styles.tools}>
                        {Array.from(visibleToolIds).map(toolId => {
                            const config = TOOLS_REGISTRY[toolId];
                            if (!config) return null;
                            const Icon = (Icons as any)[config.icon] || Icons.HelpCircle;

                            return (
                                <button
                                    key={toolId}
                                    draggable="true"
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('toolId', toolId);
                                    }}
                                    className={`${styles.toolBtn} ${slots.includes(toolId) ? styles.activeTool : ''}`}
                                    onClick={() => handleToolClick(toolId)}
                                    title={(t.tool as any)[toolId] || toolId}
                                >
                                    <Icon size={24} />
                                    <span>{(t.tool as any)[toolId] || toolId}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>

            {/* Mobile Nav Bar */}
            <nav className={`${styles.mobileNav} ${styles.mobileOnly}`}>
                {mobileButtons.map(btn => {
                    const Icon = (Icons as any)[btn.icon] || Icons.HelpCircle;
                    return (
                        <button
                            key={btn.id}
                            className={`${styles.toolBtn} ${slots.includes(btn.id) ? styles.activeTool : ''}`}
                            onClick={() => handleToolClick(btn.id)}
                        >
                            <Icon size={26} />
                        </button>
                    );
                })}
                <button onClick={onProfileClick} className={styles.toolBtn}>
                    <Icons.User size={26} />
                </button>
            </nav>

            {/* Desktop Bottom */}
            <div className={`${styles.bottom} ${styles.desktopOnly}`}>
                <button
                    onClick={onProfileClick}
                    className={styles.profileLink}
                    title={t.sidebar.profile}
                >
                    <Icons.User size={24} />
                    <span>{t.sidebar.profile}</span>
                </button>
                <button onClick={signOut} className={styles.logoutBtn} title={t.auth.logout}>
                    <Icons.LogOut size={24} />
                    <span>{t.auth.logout}</span>
                </button>
            </div>
        </aside>
    );
}

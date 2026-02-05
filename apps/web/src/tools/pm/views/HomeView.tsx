"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useOrganization } from '@/context/OrganizationContext';
import { pmApi } from '../api';
import { PMView } from '../PMPanel';
import * as Icons from 'lucide-react';
import styles from '../pm.module.css';

interface HomeViewProps {
    setView: (view: PMView) => void;
}

export default function HomeView({ setView }: HomeViewProps) {
    const { t } = useLanguage();
    const { organizationId } = useOrganization();
    const [privateProjects, setPrivateProjects] = useState<any[]>([]);
    const [onlineProjects, setOnlineProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPrivateTitle, setNewPrivateTitle] = useState('');
    const [newOnlineTitle, setNewOnlineTitle] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const pvt = await pmApi.getPrivateProjects();
                setPrivateProjects(pvt);

                if (organizationId) {
                    const online = await pmApi.getOnlineProjects(organizationId);
                    setOnlineProjects(online);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [organizationId]);

    const handleCreatePrivate = async () => {
        if (!newPrivateTitle.trim()) return;
        try {
            const res = await pmApi.createPrivateProject(newPrivateTitle);
            setPrivateProjects([res, ...privateProjects]);
            setNewPrivateTitle('');
        } catch (err) {
            alert('Failed to create private project');
        }
    };

    const handleCreateOnline = async () => {
        if (!newOnlineTitle.trim() || !organizationId) return;
        try {
            const res = await pmApi.createOnlineProject(organizationId, newOnlineTitle);
            // RPC might return the newly created project or void
            // For now, let's refresh the list
            const online = await pmApi.getOnlineProjects(organizationId);
            setOnlineProjects(online);
            setNewOnlineTitle('');
        } catch (err) {
            alert('Failed to create online project');
        }
    };

    if (loading) return <div className={styles.emptyState}>{t.common.loading}</div>;

    return (
        <div className={styles.scrollArea}>
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Private Projects</h3>
                </div>
                <div className={styles.inputGroup}>
                    <input
                        className={styles.input}
                        placeholder="New project title..."
                        value={newPrivateTitle}
                        onChange={e => setNewPrivateTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreatePrivate()}
                    />
                    <button className={styles.createBtn} onClick={handleCreatePrivate}>
                        <Icons.Plus size={16} />
                    </button>
                </div>
                {privateProjects.map(p => (
                    <div
                        key={p.id}
                        className={styles.card}
                        onClick={() => setView({ type: 'private-detail', projectId: p.id, title: p.title })}
                    >
                        <span className={styles.cardTitle}>{p.title}</span>
                    </div>
                ))}
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Online Projects</h3>
                </div>
                {!organizationId ? (
                    <p className={styles.emptyState}>Select an organization to see online projects.</p>
                ) : (
                    <>
                        <div className={styles.inputGroup}>
                            <input
                                className={styles.input}
                                placeholder="New online project title..."
                                value={newOnlineTitle}
                                onChange={e => setNewOnlineTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateOnline()}
                            />
                            <button className={styles.createBtn} onClick={handleCreateOnline}>
                                <Icons.Plus size={16} />
                            </button>
                        </div>
                        {onlineProjects.map(p => (
                            <div
                                key={p.id}
                                className={styles.card}
                                onClick={() => setView({ type: 'online-detail', projectId: p.id, title: p.title })}
                            >
                                <span className={styles.cardTitle}>{p.title}</span>
                            </div>
                        ))}
                        {onlineProjects.length === 0 && (
                            <div className={styles.emptyState}>No online projects in this organization.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

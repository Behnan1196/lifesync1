"use client";

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { pmApi } from '../api';
import { PMView } from '../PMPanel';
import * as Icons from 'lucide-react';
import styles from '../pm.module.css';

interface ProjectDetailViewProps {
    view: { type: 'private-detail' | 'online-detail'; projectId: string; title: string };
    setView: (view: PMView) => void;
}

export default function ProjectDetailView({ view, setView }: ProjectDetailViewProps) {
    const { t } = useLanguage();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [memberData, setMemberData] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [shareEmail, setShareEmail] = useState('');
    const [showShare, setShowShare] = useState(false);

    const isOnline = view.type === 'online-detail';

    const loadMembers = async () => {
        if (!isOnline) return;
        try {
            const data = await pmApi.getOnlineProjectMembers(view.projectId);
            setMembers(data);
        } catch (err) {
            console.error('Failed to load members:', err);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                let data = [];
                if (isOnline) {
                    data = await pmApi.getOnlineItems(view.projectId);
                    const mem = await pmApi.isOnlineProjectMember(view.projectId);
                    setMemberData(mem);
                    if (mem?.role === 'owner') {
                        loadMembers();
                    }
                } else {
                    data = await pmApi.getPrivateItems(view.projectId);
                    setMemberData({ role: 'owner' });
                }
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [view.projectId, isOnline]);

    const handleCreateItem = async () => {
        if (!newItemTitle.trim()) return;
        try {
            let res;
            if (isOnline) {
                res = await pmApi.createOnlineItem(view.projectId, newItemTitle);
            } else {
                res = await pmApi.createPrivateItem(view.projectId, newItemTitle);
            }
            setItems([...items, res]);
            setNewItemTitle('');
        } catch (err) {
            alert('Failed to create item');
        }
    };

    const handleShare = async () => {
        if (!shareEmail.trim()) return;
        try {
            await pmApi.shareOnlineProject(view.projectId, shareEmail);
            alert('Member added successfully');
            setShareEmail('');
            loadMembers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error sharing project');
        }
    };

    const handleRemoveMember = async (email: string) => {
        if (!confirm(`Remove ${email} from project?`)) return;
        try {
            await pmApi.removeOnlineProjectMember(view.projectId, email);
            loadMembers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error removing member');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            if (isOnline) {
                await pmApi.deleteOnlineItem(itemId);
            } else {
                await pmApi.deletePrivateItem(itemId);
            }
            setItems(items.filter(i => i.id !== itemId));
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    const toggleSchedule = async (item: any) => {
        // Field-level editing logic
        const updates = item.scheduled_date
            ? { scheduled_date: null, scheduled_time: null }
            : { scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '09:00' };

        try {
            if (isOnline) {
                await pmApi.updateOnlineItem(item.id, updates);
            } else {
                await pmApi.updatePrivateItem(item.id, updates);
            }
            setItems(items.map(i => i.id === item.id ? { ...i, ...updates } : i));
        } catch (err) {
            alert('Failed to update schedule');
        }
    };

    if (loading) return <div className={styles.emptyState}>{t.common.loading}</div>;

    // Online Project UX Rule: Check if membership exists
    if (isOnline && !memberData) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <button onClick={() => setView({ type: 'home' })} className={styles.backBtn}>
                        <Icons.ArrowLeft size={20} />
                    </button>
                    <h2 className={styles.headerTitle}>{view.title}</h2>
                </header>
                <div className={styles.emptyState}>
                    <Icons.ShieldAlert size={48} className={styles.emptyIcon} />
                    <p>You are not a member of this project.</p>
                    <button
                        onClick={() => setView({ type: 'home' })}
                        style={{ marginTop: '1rem', color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                        Back to projects
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = memberData?.role === 'owner';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => setView({ type: 'home' })} className={styles.backBtn}>
                    <Icons.ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 className={styles.headerTitle}>{view.title}</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {isOnline ? `Online Project (${memberData?.role || 'member'})` : 'Private Project'}
                    </span>
                </div>
                {isOnline && isOwner && (
                    <button
                        onClick={() => setShowShare(!showShare)}
                        title="Share Project"
                        className={styles.shareToggleBtn}
                    >
                        <Icons.UserPlus size={20} />
                    </button>
                )}
            </header>

            <div className={styles.scrollArea}>
                {showShare && (
                    <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                            <input
                                className={styles.input}
                                placeholder="User email to share with..."
                                value={shareEmail}
                                onChange={e => setShareEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleShare()}
                            />
                            <button className={styles.createBtn} onClick={handleShare}>
                                <Icons.UserPlus size={16} />
                            </button>
                        </div>

                        <div className={styles.sectionTitle} style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Current Members</div>
                        {members.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {members.map(m => (
                                    <div key={m.user_id} className={styles.item} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.4rem', background: 'var(--background)' }}>
                                        <div className={styles.itemInfo}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.email}</span>
                                                {m.is_owner && <span style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'white', padding: '1px 4px', borderRadius: '4px' }}>OWNER</span>}
                                            </div>
                                            {m.full_name && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.full_name}</span>
                                            )}
                                        </div>
                                        {!m.is_owner && (
                                            <button onClick={() => handleRemoveMember(m.email)} title="Remove Member" style={{ color: 'var(--error)' }}>
                                                <Icons.UserMinus size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No members found</p>
                        )}
                    </div>
                )}
                <div className={styles.inputGroup} style={{ padding: '0 0.5rem' }}>
                    <input
                        className={styles.input}
                        placeholder="Add new task..."
                        value={newItemTitle}
                        onChange={e => setNewItemTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateItem()}
                    />
                    <button className={styles.createBtn} onClick={handleCreateItem}>
                        <Icons.Plus size={16} />
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Icons.CheckSquare size={48} className={styles.emptyIcon} />
                        <p>{isOnline ? "No tasks added yet." : "This project is empty."}</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className={styles.item}>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemTitle}>{item.title}</span>
                                <div className={styles.itemMeta}>
                                    {item.scheduled_date ? (
                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                            {item.scheduled_date} {item.scheduled_time}
                                        </span>
                                    ) : (
                                        <span>Unscheduled</span>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => toggleSchedule(item)} title="Toggle Schedule">
                                <Icons.Calendar size={16} />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} title="Delete">
                                <Icons.Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

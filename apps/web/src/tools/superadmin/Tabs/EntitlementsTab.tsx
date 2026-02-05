"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../superadmin.module.css';
import { ASSIGNABLE_TOOLS } from '@/workbench/registry';
import { Search, Save, Trash2 } from 'lucide-react';

export default function EntitlementsTab() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const resolveUser = async () => {
        if (!email) return;
        setLoading(true);
        setMessage(null);
        setUserId(null);
        setSelectedTools([]);

        try {
            const res = await fetch('/api/admin/users/resolve-id-by-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                const data = await res.json();
                setUserId(data.user_id);

                // Fetch current overrides
                const entRes = await fetch(`/api/admin/entitlements?user_id=${data.user_id}`);
                if (entRes.ok) {
                    const tools = await entRes.json();
                    setSelectedTools(tools);
                }
            } else {
                setMessage({ type: 'error', text: t.superadmin.entitlements.userNotFound });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTool = (id: string) => {
        setSelectedTools(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/entitlements/set-user-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, tools: selectedTools }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: t.common.success });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/entitlements/clear-user-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            if (res.ok) {
                setSelectedTools([]);
                setMessage({ type: 'success', text: t.common.success });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.header}>
                <h3>{t.superadmin.entitlements.title}</h3>
            </div>

            <div className={`${styles.card} glass`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className={styles.formGroup}>
                    <label>{t.superadmin.entitlements.lookup}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && resolveUser()}
                            style={{ flex: 1 }}
                        />
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={resolveUser} disabled={loading}>
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {userId && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className={styles.formGroup}>
                            <label>{t.superadmin.entitlements.userId}</label>
                            <input type="text" value={userId} readOnly style={{ opacity: 0.7, fontFamily: 'monospace', fontSize: '0.8125rem' }} />
                        </div>

                        <div className={styles.formGroup}>
                            <label>{t.superadmin.entitlements.tools}</label>
                            {ASSIGNABLE_TOOLS.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t.superadmin.entitlements.noAssignable}</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {ASSIGNABLE_TOOLS.map(toolId => (
                                        <label key={toolId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTools.includes(toolId)}
                                                onChange={() => toggleTool(toolId)}
                                                style={{ width: '1.125rem', height: '1.125rem' }}
                                            />
                                            <span>{(t.tool as any)[toolId] || toolId}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleSave}
                                disabled={loading}
                            >
                                <Save size={18} />
                                {t.superadmin.entitlements.save}
                            </button>
                            <button
                                className={styles.btnGhost}
                                onClick={handleClear}
                                disabled={loading}
                                style={{ color: 'var(--error)' }}
                            >
                                <Trash2 size={18} />
                                {t.superadmin.entitlements.clear}
                            </button>
                        </div>
                    </div>
                )}

                {message && (
                    <div style={{ padding: '0.75rem', borderRadius: '0.375rem', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--error)', fontSize: '0.875rem' }}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}

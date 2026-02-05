"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../superadmin.module.css';
import { Plus, Building2 } from 'lucide-react';

interface Organization {
    id: string;
    name: string;
}

export default function OrganizationsTab() {
    const { t } = useLanguage();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');

    const fetchOrgs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orgs/list');
            if (res.ok) {
                const data = await res.json();
                setOrgs(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrgs();
    }, [fetchOrgs]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName) return;

        try {
            const res = await fetch('/api/admin/orgs/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newOrgName }),
            });

            if (res.ok) {
                setNewOrgName('');
                setShowCreateModal(false);
                fetchOrgs();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.header}>
                <h3>{t.superadmin.orgs.title}</h3>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    {t.superadmin.orgs.create}
                </button>
            </div>

            {loading ? (
                <p>{t.common.loading}</p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t.superadmin.orgs.name}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orgs.map(org => (
                            <tr key={org.id}>
                                <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{org.id}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Building2 size={16} className={styles.btnGhost} />
                                        {org.name}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {orgs.length === 0 && (
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    {t.superadmin.orgs.noOrgs}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {showCreateModal && (
                <div className={styles.modalOveray}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{t.superadmin.orgs.create}</h3>
                        </div>
                        <form onSubmit={handleCreateOrg}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>{t.superadmin.orgs.name}</label>
                                    <input
                                        type="text"
                                        value={newOrgName}
                                        onChange={(e) => setNewOrgName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnGhost} onClick={() => setShowCreateModal(false)}>
                                    {t.common.cancel}
                                </button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                                    {t.common.create}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

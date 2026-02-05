"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../superadmin.module.css';
import { UserPlus, Settings, Trash2, ShieldAlert, Key, Plus } from 'lucide-react';

interface User {
    id: string;
    email: string;
    created_at: string;
}

interface Organization {
    id: string;
    name: string;
}

interface Membership {
    organization_id: string;
    organization_name: string;
    role: string;
}

export default function UsersTab() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [membershipsMap, setMembershipsMap] = useState<Record<string, Membership[]>>({});
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState<{ userEmail: string } | null>(null);
    const [showRemoveModal, setShowRemoveModal] = useState<{ userEmail: string; userId: string } | null>(null);
    const [createdUserPassword, setCreatedUserPassword] = useState<string | null>(null);

    // Forms
    const [createUserForm, setCreateUserForm] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        birth_date: '',
        organization_id: '',
        role: 'member'
    });

    const [assignForm, setAssignForm] = useState({
        organization_id: '',
        role: 'member'
    });

    const [removeOrgId, setRemoveOrgId] = useState('');

    const fetchMemberships = useCallback(async (orgList: Organization[]) => {
        const newMap: Record<string, Membership[]> = {};

        // Concurrency limiting (chucks of 5 as per rule)
        const chunkSize = 5;
        for (let i = 0; i < orgList.length; i += chunkSize) {
            const chunk = orgList.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (org) => {
                try {
                    const res = await fetch(`/api/admin/orgs/members?org_id=${org.id}`);
                    if (res.ok) {
                        const members = await res.json();
                        members.forEach((m: any) => {
                            if (!newMap[m.user_id]) newMap[m.user_id] = [];
                            newMap[m.user_id].push({
                                organization_id: org.id,
                                organization_name: org.name,
                                role: m.role
                            });
                        });
                    }
                } catch (err) {
                    console.error(`Failed to fetch members for org ${org.id}`, err);
                }
            }));
        }
        setMembershipsMap(newMap);
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, orgsRes] = await Promise.all([
                fetch('/api/admin/users/list'),
                fetch('/api/admin/orgs/list')
            ]);

            if (usersRes.ok && orgsRes.ok) {
                const usersData = await usersRes.json();
                const orgsData = await orgsRes.json();
                setUsers(usersData);
                setOrgs(orgsData);
                await fetchMemberships(orgsData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [fetchMemberships]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createUserForm),
            });

            if (res.ok) {
                setCreatedUserPassword(createUserForm.password);
                // We don't close modal immediately if we want to show the password notice
                // but the requirement says "Must include: Password field... Password MUST be shown... only at creation time"
                // I'll keep the modal open but show the password success state.
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create user');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generatePass = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCreateUserForm(prev => ({ ...prev, password: pass }));
    };

    const handleAssignOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showAssignModal) return;
        try {
            const res = await fetch('/api/admin/users/assign-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: showAssignModal.userEmail,
                    ...assignForm
                }),
            });

            if (res.ok) {
                setShowAssignModal(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to assign organization');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showRemoveModal || !removeOrgId) return;
        try {
            const res = await fetch('/api/admin/users/remove-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: showRemoveModal.userEmail,
                    organization_id: removeOrgId
                }),
            });

            if (res.ok) {
                setShowRemoveModal(null);
                setRemoveOrgId('');
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.header}>
                <h3>{t.superadmin.users.title}</h3>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => {
                    setCreatedUserPassword(null);
                    setCreateUserForm({
                        email: '',
                        password: '',
                        full_name: '',
                        phone: '',
                        birth_date: '',
                        organization_id: '',
                        role: 'member'
                    });
                    setShowCreateModal(true);
                }}>
                    <UserPlus size={18} />
                    {t.superadmin.users.create}
                </button>
            </div>

            {loading ? (
                <p>{t.common.loading}</p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>{t.auth.email}</th>
                            <th>User ID</th>
                            <th>{t.superadmin.users.memberships}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const memberships = membershipsMap[user.id] || [];
                            return (
                                <tr key={user.id}>
                                    <td>{user.email}</td>
                                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{user.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                            {memberships.map(m => (
                                                <span key={m.organization_id} className={`${styles.badge} ${m.role === 'owner' ? styles.badgeSecondary : ''}`}>
                                                    {m.organization_name} ({m.role})
                                                </span>
                                            ))}
                                            {memberships.length === 0 && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8125rem' }}>-</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.btnGhost}
                                                onClick={() => {
                                                    setAssignForm({ organization_id: '', role: 'member' });
                                                    setShowAssignModal({ userEmail: user.email });
                                                }}
                                                title={t.superadmin.users.assignOrg}
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                className={styles.btnGhost}
                                                onClick={() => {
                                                    const userMemberships = membershipsMap[user.id] || [];
                                                    if (userMemberships.length > 0) {
                                                        setRemoveOrgId(userMemberships[0].organization_id);
                                                        setShowRemoveModal({ userEmail: user.email, userId: user.id });
                                                    }
                                                }}
                                                title={t.superadmin.users.removeOrg}
                                                disabled={(membershipsMap[user.id] || []).length === 0}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className={styles.modalOveray}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{t.superadmin.users.create}</h3>
                        </div>
                        {!createdUserPassword ? (
                            <form onSubmit={handleCreateUser}>
                                <div className={styles.modalBody}>
                                    <div className={styles.formGroup}>
                                        <label>{t.superadmin.users.email} *</label>
                                        <input type="email" value={createUserForm.email} onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })} required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>{t.superadmin.users.password} *</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" value={createUserForm.password} onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })} required />
                                            <button type="button" className={styles.btnGhost} onClick={generatePass} title={t.superadmin.users.generatePassword}>
                                                <Key size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>{t.superadmin.users.fullName}</label>
                                        <input type="text" value={createUserForm.full_name} onChange={e => setCreateUserForm({ ...createUserForm, full_name: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>{t.superadmin.users.phone}</label>
                                            <input type="text" value={createUserForm.phone} onChange={e => setCreateUserForm({ ...createUserForm, phone: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>{t.superadmin.users.birthDate}</label>
                                            <input type="date" value={createUserForm.birth_date} onChange={e => setCreateUserForm({ ...createUserForm, birth_date: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                        <div className={styles.formGroup}>
                                            <label>{t.sidebar.organizations} (Optional)</label>
                                            <select value={createUserForm.organization_id} onChange={e => setCreateUserForm({ ...createUserForm, organization_id: e.target.value })}>
                                                <option value="">None</option>
                                                {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                            </select>
                                        </div>
                                        {createUserForm.organization_id && (
                                            <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                                                <label>{t.profile.role}</label>
                                                <select value={createUserForm.role} onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value })}>
                                                    <option value="member">Member</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.modalFooter}>
                                    <button type="button" className={styles.btnGhost} onClick={() => setShowCreateModal(false)}>{t.common.cancel}</button>
                                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>{t.common.create}</button>
                                </div>
                            </form>
                        ) : (
                            <div className={styles.modalBody}>
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                                        <ShieldAlert size={48} style={{ margin: '0 auto' }} />
                                        <h4 style={{ marginTop: '0.5rem' }}>{t.common.success}</h4>
                                    </div>
                                    <p>{t.superadmin.users.passwordCopy}</p>
                                    <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '0.5rem', margin: '1rem 0', fontSize: '1.25rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                                        {createdUserPassword}
                                    </div>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }} onClick={() => setShowCreateModal(false)}>
                                        {t.common.close}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assign Org Modal */}
            {showAssignModal && (
                <div className={styles.modalOveray}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{t.superadmin.users.assignOrg}</h3>
                        </div>
                        <form onSubmit={handleAssignOrg}>
                            <div className={styles.modalBody}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>User: {showAssignModal.userEmail}</p>
                                <div className={styles.formGroup}>
                                    <label>{t.sidebar.organizations}</label>
                                    <select value={assignForm.organization_id} onChange={e => setAssignForm({ ...assignForm, organization_id: e.target.value })} required>
                                        <option value="">Select Organization</option>
                                        {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t.profile.role}</label>
                                    <select value={assignForm.role} onChange={e => setAssignForm({ ...assignForm, role: e.target.value })} required>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnGhost} onClick={() => setShowAssignModal(null)}>{t.common.cancel}</button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>{t.common.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Remove Org Modal */}
            {showRemoveModal && (
                <div className={styles.modalOveray}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{t.superadmin.users.removeOrg}</h3>
                        </div>
                        <form onSubmit={handleRemoveOrg}>
                            <div className={styles.modalBody}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>User: {showRemoveModal.userEmail}</p>
                                <div className={styles.formGroup}>
                                    <label>{t.sidebar.organizations}</label>
                                    <select value={removeOrgId} onChange={e => setRemoveOrgId(e.target.value)} required>
                                        {(membershipsMap[showRemoveModal.userId] || []).map(m => (
                                            <option key={m.organization_id} value={m.organization_id}>{m.organization_name}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Check for owner special case */}
                                {(membershipsMap[showRemoveModal.userId] || []).find(m => m.organization_id === removeOrgId)?.role === 'owner' && (
                                    <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                        {t.superadmin.users.ownerNotice}
                                    </p>
                                )}
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnGhost} onClick={() => setShowRemoveModal(null)}>{t.common.cancel}</button>
                                <button
                                    type="submit"
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    style={{ background: 'var(--error)' }}
                                    disabled={(membershipsMap[showRemoveModal.userId] || []).find(m => m.organization_id === removeOrgId)?.role === 'owner'}
                                >
                                    {t.common.remove}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

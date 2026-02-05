"use client";

import React from 'react';
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOrganization } from "@/context/OrganizationContext";
import * as Icons from 'lucide-react';
import styles from './profile-drawer.module.css';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { user, role, signOut } = useAuth();
    const { t } = useLanguage();
    const { organizationId } = useOrganization();

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.drawer} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.profile.title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <Icons.X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.email}>{user?.email}</div>
                    </div>

                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <Icons.Shield size={18} />
                            <div className={styles.infoText}>
                                <label>{t.profile.role}</label>
                                <span>{role}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <Icons.Building2 size={18} />
                            <div className={styles.infoText}>
                                <label>{t.profile.currentOrg}</label>
                                <span>{organizationId || t.sidebar.noOrg}</span>
                            </div>
                        </div>
                    </div>

                    <button className={styles.editBtn} disabled>
                        {t.common.save || 'Edit Profile'} (Coming Soon)
                    </button>

                    <button
                        onClick={() => {
                            signOut();
                            onClose();
                        }}
                        className={styles.logoutBtn}
                    >
                        <Icons.LogOut size={18} />
                        <span>{t.auth.logout}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

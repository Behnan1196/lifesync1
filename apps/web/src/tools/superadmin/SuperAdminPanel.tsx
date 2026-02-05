"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './superadmin.module.css';
import OrganizationsTab from './Tabs/OrganizationsTab';
import UsersTab from './Tabs/UsersTab';
import EntitlementsTab from './Tabs/EntitlementsTab';

type Tab = 'orgs' | 'users' | 'entitlements';

export default function SuperAdminPanel() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('users');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{t.tool.superadmin}</h2>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'users' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    {t.superadmin.tabs.users}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'orgs' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('orgs')}
                >
                    {t.superadmin.tabs.organizations}
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'entitlements' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('entitlements')}
                >
                    {t.superadmin.tabs.entitlements}
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'orgs' && <OrganizationsTab />}
                {activeTab === 'entitlements' && <EntitlementsTab />}
            </div>
        </div>
    );
}

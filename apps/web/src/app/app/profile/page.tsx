"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOrganization } from "@/context/OrganizationContext";
import styles from "./profile.module.css";

export default function ProfilePage() {
    const { user, role } = useAuth();
    const { t } = useLanguage();
    const { organizationId } = useOrganization();

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t.profile.title}</h1>

            <div className={`${styles.card} glass`}>
                <div className={styles.infoRow}>
                    <label>{t.profile.email}</label>
                    <span>{user?.email}</span>
                </div>
                <div className={styles.infoRow}>
                    <label>{t.profile.role}</label>
                    <span className={styles.badge}>{role}</span>
                </div>
                <div className={styles.infoRow}>
                    <label>{t.profile.currentOrg}</label>
                    <span>{organizationId || t.sidebar.noOrg}</span>
                </div>
            </div>
        </div>
    );
}

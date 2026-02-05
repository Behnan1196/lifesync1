"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function SetupIncompletePage() {
    const { t } = useLanguage();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <h1 style={{ color: 'var(--error)', marginBottom: '1rem' }}>{t.setup.incomplete}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{t.setup.dbMissing}</p>
        </div>
    );
}

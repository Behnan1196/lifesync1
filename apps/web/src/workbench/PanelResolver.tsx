"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface PanelResolverProps {
    toolId: string;
}

import SuperAdminPanel from '@/tools/superadmin/SuperAdminPanel';
import ToolsList from '@/tools/toolsList/ToolsList';
import PMPanel from '@/tools/pm/PMPanel';
import AgendaPanel from '@/tools/agenda/AgendaPanel';

export const PanelResolver: React.FC<PanelResolverProps> = ({ toolId }) => {
    const { t } = useLanguage();

    if (toolId === 'superadmin') {
        return <SuperAdminPanel />;
    }

    if (toolId === 'tools') {
        return <ToolsList />;
    }

    if (toolId === 'pm') {
        return <PMPanel />;
    }

    if (toolId === 'agenda') {
        return <AgendaPanel />;
    }

    // Placeholder content for other tools
    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {toolId.toUpperCase()} Panel
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
                This is a placeholder for the {toolId} tool.
            </p>
            <div
                style={{
                    flex: 1,
                    border: '2px dashed var(--border)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                }}
            >
                {toolId} Content Area
            </div>
        </div>
    );
};

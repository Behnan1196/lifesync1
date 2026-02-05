"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { TOOLS_REGISTRY, ASSIGNABLE_TOOLS } from '@/workbench/registry';
import * as Icons from 'lucide-react';
import styles from './toolslist.module.css';

export default function ToolsList() {
    const { t } = useLanguage();
    const { openPanel, slots, entitlements, isSuperAdmin } = useWorkspace();
    const [search, setSearch] = useState('');

    const allTools = Object.values(TOOLS_REGISTRY).filter(tool => {
        if (tool.isSystem) return false;
        if (isSuperAdmin) return true;
        return entitlements.includes(tool.id);
    });

    const filteredTools = allTools.filter(tool =>
        (t.tool as any)[tool.id]?.toLowerCase().includes(search.toLowerCase()) ||
        tool.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchWrapper}>
                    <Icons.Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={t.sidebar.tools + "..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {filteredTools.map(tool => {
                    const Icon = (Icons as any)[tool.icon] || Icons.HelpCircle;
                    const isOpen = slots.includes(tool.id);

                    return (
                        <button
                            key={tool.id}
                            className={`${styles.toolCard} ${isOpen ? styles.active : ''}`}
                            onClick={() => openPanel(tool.id)}
                            draggable="true"
                            onDragStart={(e) => {
                                e.dataTransfer.setData('toolId', tool.id);
                            }}
                        >
                            <div className={styles.iconWrapper}>
                                <Icon size={32} />
                            </div>
                            <span className={styles.toolName}>
                                {(t.tool as any)[tool.id] || tool.id}
                            </span>
                            {isOpen && <div className={styles.indicator} />}
                        </button>
                    );
                })}
            </div>

            {filteredTools.length === 0 && (
                <div className={styles.noResults}>
                    <Icons.AlertCircle size={48} />
                    <p>No tools found</p>
                </div>
            )}
        </div>
    );
}

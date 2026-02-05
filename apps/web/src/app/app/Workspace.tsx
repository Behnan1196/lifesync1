"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PanelResolver } from '@/workbench/PanelResolver';
import { TOOLS_REGISTRY } from '@/workbench/registry';
import * as Icons from 'lucide-react';
import styles from './workspace.module.css';

interface SlotProps {
    index: number;
    toolId: string | null;
    isMobile: boolean;
}

const Slot: React.FC<SlotProps> = ({ index, toolId, isMobile }) => {
    const { t } = useLanguage();
    const { assignTool, removeTool } = useWorkspace();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const toolId = e.dataTransfer.getData('toolId');
        if (toolId) assignTool(index, toolId);
    };

    if (toolId) {
        const config = TOOLS_REGISTRY[toolId];
        const Icon = config ? (Icons as any)[config.icon] : Icons.HelpCircle;

        return (
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={14} className={styles.panelIcon} />
                        <span className={styles.panelTitle}>
                            {(t.tool as any)[toolId] || toolId}
                        </span>
                    </div>
                    <button
                        onClick={() => removeTool(index)}
                        className={styles.closeBtn}
                        title={t.common.close}
                    >
                        <Icons.X size={16} />
                    </button>
                </div>
                <div className={styles.panelBody}>
                    <PanelResolver toolId={toolId} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${styles.placeholder} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            <Icons.Plus size={24} style={{ opacity: 0.3 }} />
            <span>{t.workspace.emptyState || 'Drop tool here'}</span>
        </div>
    );
};

export default function Workspace() {
    const { t } = useLanguage();
    const {
        slots, focusedSlotIndex,
        horizontalSplit, setHorizontalSplit,
        verticalSplit, setVerticalSplit
    } = useWorkspace();

    const [isResizingH, setIsResizingH] = useState(false);
    const [isResizingV, setIsResizingV] = useState(false);
    const workspaceRef = useRef<HTMLDivElement>(null);

    const startResizingH = () => {
        setIsResizingH(true);
        document.addEventListener('mousemove', handleMouseMoveH);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
    };

    const startResizingV = () => {
        setIsResizingV(true);
        document.addEventListener('mousemove', handleMouseMoveV);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'row-resize';
    };

    const handleMouseMoveH = useCallback((e: MouseEvent) => {
        if (!workspaceRef.current) return;
        const rect = workspaceRef.current.getBoundingClientRect();
        const percentage = ((e.clientX - rect.left) / rect.width) * 100;
        setHorizontalSplit(Math.min(Math.max(percentage, 15), 85));
    }, [setHorizontalSplit]);

    const handleMouseMoveV = useCallback((e: MouseEvent) => {
        if (!workspaceRef.current) return;
        const rect = workspaceRef.current.getBoundingClientRect();
        const percentage = ((e.clientY - rect.top) / rect.height) * 100;
        setVerticalSplit(Math.min(Math.max(percentage, 15), 85));
    }, [setVerticalSplit]);

    const stopResizing = useCallback(() => {
        setIsResizingH(false);
        setIsResizingV(false);
        document.removeEventListener('mousemove', handleMouseMoveH);
        document.removeEventListener('mousemove', handleMouseMoveV);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, [handleMouseMoveH, handleMouseMoveV]);

    return (
        <div className={styles.workspace} ref={workspaceRef}>
            {/* Desktop View */}
            <div className={`${styles.leftContainer} ${styles.desktopOnly}`} style={{ width: `${horizontalSplit}%`, paddingRight: '0.375rem' }}>
                <Slot index={0} toolId={slots[0]} isMobile={false} />
            </div>

            <div
                className={`${styles.resizerH} ${isResizingH ? styles.resizerHActive : ''} ${styles.desktopOnly}`}
                onMouseDown={startResizingH}
            />

            <div className={`${styles.rightContainer} ${styles.desktopOnly}`} style={{ paddingLeft: '0.375rem' }}>
                <div style={{ height: `${verticalSplit}%`, paddingBottom: '0.375rem' }}>
                    <Slot index={1} toolId={slots[1]} isMobile={false} />
                </div>
                <div
                    className={`${styles.resizerV} ${isResizingV ? styles.resizerVActive : ''}`}
                    onMouseDown={startResizingV}
                />
                <div style={{ flex: 1, paddingTop: '0.375rem' }}>
                    <Slot index={2} toolId={slots[2]} isMobile={false} />
                </div>
            </div>

            {/* Mobile View: Render only the focused slot */}
            <div className={`${styles.mobileOnly}`} style={{ width: '100%', height: '100%' }}>
                <Slot
                    index={focusedSlotIndex}
                    toolId={slots[focusedSlotIndex]}
                    isMobile={true}
                />
            </div>
        </div>
    );
}

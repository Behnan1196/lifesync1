"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WorkspaceContextType {
    slots: (string | null)[];
    focusedSlotIndex: number;
    horizontalSplit: number; // 0 to 100
    verticalSplit: number;   // 0 to 100
    assignTool: (slotIndex: number, toolId: string) => void;
    removeTool: (slotIndex: number) => void;
    openPanel: (toolId: string) => void;
    setHorizontalSplit: (val: number) => void;
    setVerticalSplit: (val: number) => void;
    setFocusedSlotIndex: (idx: number) => void;
    entitlements: string[];
    setEntitlements: (val: string[]) => void;
    isSuperAdmin: boolean;
    setSuperAdmin: (val: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [slots, setSlots] = useState<(string | null)[]>([null, null, null]);
    const [focusedSlotIndex, setFocusedSlotIndex] = useState(0);
    const [horizontalSplit, setHorizontalSplit] = useState(60);
    const [verticalSplit, setVerticalSplit] = useState(50);
    const [entitlements, setEntitlements] = useState<string[]>([]);
    const [isSuperAdmin, setSuperAdmin] = useState(false);

    // Singleton tool logic: if tool is elsewhere, move it or just don't open again
    const assignTool = (slotIndex: number, toolId: string) => {
        setSlots(prev => {
            const next = [...prev];
            // If tool is already in another slot, remove it from there (move behavior)
            const existingIndex = next.indexOf(toolId);
            if (existingIndex !== -1) {
                next[existingIndex] = null;
            }
            next[slotIndex] = toolId;
            return next;
        });
        setFocusedSlotIndex(slotIndex);
    };

    const removeTool = (slotIndex: number) => {
        setSlots(prev => {
            const next = [...prev];
            next[slotIndex] = null;
            return next;
        });
    };

    const openPanel = (toolId: string) => {
        // If already open, set focus to its slot (singleton)
        const existingIndex = slots.indexOf(toolId);
        if (existingIndex !== -1) {
            setFocusedSlotIndex(existingIndex);
            return;
        }

        // Find first empty slot
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            assignTool(emptyIndex, toolId);
        } else {
            // Force assign to first slot if full? 
            // Or maybe users want it to replace Slot 0 on simple click
            assignTool(0, toolId);
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            slots,
            focusedSlotIndex,
            horizontalSplit,
            verticalSplit,
            assignTool,
            removeTool,
            openPanel,
            setHorizontalSplit,
            setVerticalSplit,
            setFocusedSlotIndex,
            entitlements,
            setEntitlements,
            isSuperAdmin,
            setSuperAdmin
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface OrganizationContextType {
    organizationId: string | null;
    setOrganizationId: (id: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [organizationId, setOrgId] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('lifesync.organization_id');
        if (saved) {
            setOrgId(saved);
        }
    }, []);

    const setOrganizationId = (id: string | null) => {
        setOrgId(id);
        if (id) {
            localStorage.setItem('lifesync.organization_id', id);
        } else {
            localStorage.removeItem('lifesync.organization_id');
        }
    };

    return (
        <OrganizationContext.Provider value={{ organizationId, setOrganizationId }}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}

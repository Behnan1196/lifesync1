"use client";

import React, { useState } from 'react';
import HomeView from './views/HomeView';
import ProjectDetailView from './views/ProjectDetailView';
import styles from './pm.module.css';

export type PMView =
    | { type: 'home' }
    | { type: 'private-detail'; projectId: string; title: string }
    | { type: 'online-detail'; projectId: string; title: string };

export default function PMPanel() {
    const [view, setView] = useState<PMView>({ type: 'home' });

    return (
        <div className={styles.container}>
            {view.type === 'home' && (
                <HomeView setView={setView} />
            )}
            {(view.type === 'private-detail' || view.type === 'online-detail') && (
                <ProjectDetailView view={view} setView={setView} />
            )}
        </div>
    );
}

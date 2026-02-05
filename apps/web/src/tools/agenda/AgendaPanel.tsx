"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import * as Icons from 'lucide-react';
import styles from './agenda.module.css';
import { agendaApi } from './api';

export default function AgendaPanel() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const [personalProjectId, setPersonalProjectId] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [view, setView] = useState<'daily' | 'weekly'>('daily');
    const [pivotDate, setPivotDate] = useState(new Date());

    const [form, setForm] = useState({
        title: '',
        type: 'task',
        date: new Date().toISOString().split('T')[0],
        time: '09:00'
    });

    const loadData = async () => {
        try {
            const pid = await agendaApi.ensurePersonalAgendaProject();
            setPersonalProjectId(pid);
            const allItems = await agendaApi.getAgendaItems();
            setItems(allItems);
        } catch (err) {
            console.error('Agenda load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const sortItems = (a: any, b: any) => {
        if (!a.scheduled_date) return 1;
        if (!b.scheduled_date) return -1;
        const dateComp = a.scheduled_date.localeCompare(b.scheduled_date);
        if (dateComp !== 0) return dateComp;
        return (a.scheduled_time || '00:00').localeCompare(b.scheduled_time || '00:00');
    };

    const navigate = (direction: number) => {
        const next = new Date(pivotDate);
        if (view === 'daily') {
            next.setDate(next.getDate() + direction);
        } else {
            next.setDate(next.getDate() + (direction * 7));
        }
        setPivotDate(next);
    };

    const handleOpenAdd = () => {
        setEditingItem(null);
        setForm({
            title: '',
            type: 'task',
            date: pivotDate.toISOString().split('T')[0],
            time: '09:00'
        });
        setShowEditor(true);
    };

    const handleOpenEdit = (item: any) => {
        setEditingItem(item);
        setForm({
            title: item.title,
            type: item.metadata?.type || 'task',
            date: item.scheduled_date || '',
            time: (item.scheduled_time || '09:00').substring(0, 5)
        });
        setShowEditor(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !personalProjectId) return;
        try {
            if (editingItem) {
                const updates = {
                    title: form.title,
                    scheduled_date: form.date || null,
                    scheduled_time: (form.time ? form.time + ':00' : null) as any,
                    metadata: { ...editingItem.metadata, type: form.type }
                };
                await agendaApi.updateItem(editingItem.id, editingItem.is_online, updates);
                setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...updates } : i).sort(sortItems));
            } else {
                const metadata = { type: form.type, subTasks: [] };
                const newItem = await agendaApi.createAgendaItem(personalProjectId, form.title, form.type, metadata);
                const finalItem = { ...newItem, scheduled_date: form.date || null, scheduled_time: form.time ? form.time + ':00' : null };
                if (form.date || form.time) {
                    await agendaApi.updateItem(newItem.id, false, {
                        scheduled_date: form.date || null,
                        scheduled_time: (form.time ? form.time + ':00' : null) as any
                    });
                }
                setItems(prev => [finalItem, ...prev].sort(sortItems));
            }
            setShowEditor(false);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save');
        }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        try {
            await agendaApi.updateItem(item.id, item.is_online, { status: newStatus as any });
            setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleUpdateMetadata = async (item: any, newMetadata: any) => {
        try {
            await agendaApi.updateItem(item.id, item.is_online, { metadata: newMetadata });
            setItems(items.map(i => i.id === item.id ? { ...i, metadata: newMetadata } : i));
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleDelete = async (item: any) => {
        try {
            await agendaApi.deleteItem(item.id, item.is_online);
            setItems(items.filter(i => i.id !== item.id));
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingOverlay}>
                <Icons.Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    // Group items by date
    // Date calculations
    const getDates = () => {
        if (view === 'daily') return [new Date(pivotDate)];

        const dates = [];
        const start = new Date(pivotDate);
        // Normalize to Monday if weekly
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const visibleDates = getDates().map(d => d.toISOString().split('T')[0]);
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
        if (item.scheduled_date && visibleDates.includes(item.scheduled_date)) {
            if (!grouped[item.scheduled_date]) grouped[item.scheduled_date] = [];
            grouped[item.scheduled_date].push(item);
        }
    });

    const unscheduled = items.filter(i => !i.scheduled_date);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleWrapper}>
                    <h2 className={styles.title}>{(t.tool as any).agenda}</h2>
                    <span className={styles.subtitle}>{t.common?.ready_to_plan || 'Ready to plan?'}</span>
                </div>
                <div className={styles.viewControls}>
                    <div className={styles.navGroup}>
                        <button className={styles.navBtn} onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /></button>
                        <button className={styles.todayBtn} onClick={() => setPivotDate(new Date())}>{t.common.today}</button>
                        <button className={styles.navBtn} onClick={() => navigate(1)}><Icons.ChevronRight size={18} /></button>
                    </div>
                    <div className={styles.toggleGroup}>
                        <button className={`${styles.toggleBtn} ${view === 'daily' ? styles.toggleBtnActive : ''}`} onClick={() => setView('daily')}>{t.common.daily}</button>
                        <button className={`${styles.toggleBtn} ${view === 'weekly' ? styles.toggleBtnActive : ''}`} onClick={() => setView('weekly')}>{t.common.weekly}</button>
                    </div>
                    <button onClick={loadData} className={styles.actionBtn}>
                        <Icons.RefreshCcw size={18} />
                    </button>
                </div>
            </header>

            <div className={`${styles.scrollArea} ${view === 'weekly' ? styles.weeklyScroll : ''}`}>
                <div className={view === 'weekly' ? styles.weeklyGrid : styles.dailyList}>
                    {visibleDates.map(date => (
                        <div key={date} className={styles.daySection}>
                            <div className={styles.dayHeader}>
                                <Icons.Calendar size={14} />
                                {date === new Date().toISOString().split('T')[0] ? t.common.today : date}
                            </div>
                            <div className={styles.itemsList}>
                                {grouped[date]?.map(item => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        onEdit={() => handleOpenEdit(item)}
                                        onDelete={() => handleDelete(item)}
                                        onUpdateStatus={(status) => handleUpdateStatus(item, status)}
                                        onUpdateMetadata={(meta) => handleUpdateMetadata(item, meta)}
                                        t={t}
                                    />
                                ))}
                                {(!grouped[date] || grouped[date].length === 0) && (
                                    <div className={styles.dayEmpty}>No items</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {view === 'daily' && unscheduled.length > 0 && (
                    <div className={styles.daySection} style={{ marginTop: '2rem' }}>
                        <div className={styles.dayHeader}>
                            <Icons.Inbox size={14} />
                            Unscheduled
                        </div>
                        <div className={styles.itemsList}>
                            {unscheduled.map(item => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    onEdit={() => handleOpenEdit(item)}
                                    onDelete={() => handleDelete(item)}
                                    onUpdateStatus={(status) => handleUpdateStatus(item, status)}
                                    onUpdateMetadata={(meta) => handleUpdateMetadata(item, meta)}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {items.length === 0 && (
                    <div className={styles.emptyState}>
                        <Icons.Compass size={48} />
                        <p>No agenda items found.<br />Plan your day here!</p>
                    </div>
                )}
            </div>

            <button className={styles.fab} onClick={handleOpenAdd}>
                <Icons.Plus size={24} />
            </button>

            {showEditor && (
                <div className={styles.modalOverlay} onClick={() => setShowEditor(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: 0 }}>{editingItem ? t.common.edit : t.common.addItem}</h3>

                        <div className={styles.formGroup}>
                            <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Title</label>
                            <input
                                className={styles.input}
                                placeholder="..."
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                        </div>

                        <div className={styles.typeSelector}>
                            {[
                                { id: 'task', icon: Icons.CheckCircle, label: t.common.task },
                                { id: 'note', icon: Icons.FileText, label: t.common.note },
                                { id: 'appt', icon: Icons.Clock, label: t.common.appt },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    className={`${styles.typeBtn} ${form.type === type.id ? styles.typeBtnActive : ''}`}
                                    onClick={() => setForm({ ...form, type: type.id })}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Date</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Time</label>
                                <input
                                    type="time"
                                    className={styles.input}
                                    value={form.time}
                                    onChange={e => setForm({ ...form, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className={styles.saveBtn} style={{ flex: 1 }} onClick={handleSave}>
                                {t.common.save}
                            </button>
                            <button className={styles.actionBtn} style={{ border: '1px solid var(--border)' }} onClick={() => setShowEditor(false)}>
                                {t.common.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ItemCardProps {
    item: any;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateStatus: (status: string) => void;
    onUpdateMetadata: (meta: any) => void;
    t: any;
}

function ItemCard({ item, onEdit, onDelete, onUpdateStatus, onUpdateMetadata, t }: ItemCardProps) {
    const isPersonal = item.project_title === 'personal_agenda';
    const displayProjectName = isPersonal ? (t.common?.personal_agenda || 'Personal Agenda') : item.project_title;
    const meta = item.metadata || {};
    const type = meta.type || 'task';
    const subTasks = meta.subTasks || [];
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [newSubTitle, setNewSubTitle] = useState('');

    const toggleSubTask = (idx: number) => {
        const next = [...subTasks];
        next[idx].done = !next[idx].done;
        onUpdateMetadata({ ...meta, subTasks: next });
    };

    const addSubTask = () => {
        if (!newSubTitle.trim()) return;
        const next = [...subTasks, { title: newSubTitle, done: false }];
        onUpdateMetadata({ ...meta, subTasks: next });
        setNewSubTitle('');
    };

    const isDone = item.status === 'done';

    const handleDelete = () => {
        if (confirm(t.common?.confirm_delete || 'Are you sure you want to delete this item?')) {
            onDelete();
        }
    };

    return (
        <div className={`${styles.itemCard} ${isDone ? styles.itemCardDone : ''} ${styles[type + 'Card']}`}>
            <div className={styles.itemContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {type === 'task' && (
                        <div
                            className={`${styles.checkbox} ${isDone ? styles.checkboxActive : ''}`}
                            onClick={() => onUpdateStatus(isDone ? 'todo' : 'done')}
                        >
                            {isDone && <Icons.Check size={10} />}
                        </div>
                    )}
                    <div className={`${styles.itemTitle} ${isDone ? styles.itemTitleDone : ''}`}>
                        {item.title}
                    </div>
                </div>

                <div className={styles.itemMeta}>
                    {item.scheduled_time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Icons.Clock size={12} />
                            {item.scheduled_time.substring(0, 5)}
                        </div>
                    )}
                    <div className={styles.projectBadge}>
                        <Icons.Hash size={12} />
                        {displayProjectName}
                    </div>
                    {item.is_online && <span className={styles.onlineBadge}>Online</span>}
                </div>

                {showBreakdown && (
                    <div className={styles.breakdownSection}>
                        {subTasks.map((st: any, idx: number) => (
                            <div key={idx} className={styles.subItem}>
                                <div
                                    className={`${styles.checkbox} ${st.done ? styles.checkboxActive : ''}`}
                                    onClick={() => toggleSubTask(idx)}
                                >
                                    {st.done && <Icons.Check size={8} />}
                                </div>
                                <span className={st.done ? styles.subItemDone : ''}>{st.title}</span>
                            </div>
                        ))}
                        <div className={styles.subItem}>
                            <Icons.Plus size={12} />
                            <input
                                className={styles.subItemInput}
                                placeholder="Add sub-task..."
                                value={newSubTitle}
                                onChange={e => setNewSubTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addSubTask()}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button onClick={() => setShowBreakdown(!showBreakdown)} className={styles.actionBtn} title="Breakdown">
                    <Icons.ListTree size={16} />
                </button>
                <button onClick={onEdit} className={styles.actionBtn} title="Edit">
                    <Icons.Settings2 size={16} />
                </button>
                <button onClick={handleDelete} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete">
                    <Icons.Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

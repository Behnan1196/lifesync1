import { createClient } from '@/lib/supabase';

const supabase = createClient();

export const agendaApi = {
    async ensurePersonalAgendaProject(): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Check local cache
        const cachedId = localStorage.getItem(`ls_personal_agenda_${user.id}`);
        if (cachedId) {
            // Verify it still exists
            const { data } = await supabase
                .from('private_projects')
                .select('id')
                .eq('id', cachedId)
                .eq('owner_user_id', user.id)
                .maybeSingle();

            if (data) return data.id;
        }

        // Discover
        const { data: project } = await supabase
            .from('private_projects')
            .select('id')
            .eq('owner_user_id', user.id)
            .eq('title', 'personal_agenda')
            .maybeSingle();

        if (project) {
            localStorage.setItem(`ls_personal_agenda_${user.id}`, project.id);
            return project.id;
        }

        // Create
        const { data: newProject, error: createError } = await supabase
            .from('private_projects')
            .insert({
                owner_user_id: user.id,
                title: 'personal_agenda'
            })
            .select()
            .single();

        if (createError) throw createError;

        localStorage.setItem(`ls_personal_agenda_${user.id}`, newProject.id);
        return newProject.id;
    },

    async getAgendaItems() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Private items (all)
        const { data: privateItems, error: privErr } = await supabase
            .from('private_items')
            .select('*, private_projects(title)')
            .eq('owner_user_id', user.id);

        if (privErr) throw privErr;

        // 2. Online Items (where user is member)
        // Step 1: Query online_project_members -> get project_ids
        const { data: memberships, error: memErr } = await supabase
            .from('online_project_members')
            .select('online_project_id')
            .eq('user_id', user.id);

        if (memErr) throw memErr;

        const onlineProjectIds = memberships.map(m => m.online_project_id);

        let onlineItems: any[] = [];
        if (onlineProjectIds.length > 0) {
            const { data, error: itemErr } = await supabase
                .from('online_items')
                .select('*, online_projects(title)')
                .in('online_project_id', onlineProjectIds);

            if (itemErr) throw itemErr;
            onlineItems = data || [];
        }

        // Merge and tag
        const allItems = [
            ...(privateItems || []).map(i => ({
                ...i,
                is_online: false,
                project_title: i.private_projects?.title === 'personal_agenda' ? 'personal_agenda' : i.private_projects?.title
            })),
            ...onlineItems.map(i => ({
                ...i,
                is_online: true,
                project_title: i.online_projects?.title
            }))
        ];

        return allItems.sort((a, b) => {
            if (!a.scheduled_date) return 1;
            if (!b.scheduled_date) return -1;
            const dateComp = a.scheduled_date.localeCompare(b.scheduled_date);
            if (dateComp !== 0) return dateComp;
            return (a.scheduled_time || '00:00').localeCompare(b.scheduled_time || '00:00');
        });
    },

    async createAgendaItem(projectId: string, title: string, type: string, metadata: any = {}) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('private_items')
            .insert({
                project_id: projectId,
                owner_user_id: user.id,
                title,
                status: 'todo',
                metadata: { ...metadata, type },
                scheduled_date: new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;
        return { ...data, is_online: false, project_title: 'personal_agenda' };
    },

    async updateItem(itemId: string, isOnline: boolean, updates: {
        status?: 'todo' | 'done',
        metadata?: any,
        scheduled_date?: string | null,
        scheduled_time?: string | null,
        title?: string
    }) {
        const table = isOnline ? 'online_items' : 'private_items';
        const { error } = await supabase
            .from(table)
            .update(updates)
            .eq('id', itemId);

        if (error) throw error;
    },

    async deleteItem(itemId: string, isOnline: boolean) {
        const table = isOnline ? 'online_items' : 'private_items';
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    }
};

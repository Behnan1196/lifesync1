import { createClient } from '@/lib/supabase';

const supabase = createClient();

export const pmApi = {
    // PRIVATE PROJECTS
    async getPrivateProjects() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('private_projects')
            .select('*')
            .eq('owner_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createPrivateProject(title: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('private_projects')
            .insert({
                title,
                owner_user_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // PRIVATE ITEMS
    async getPrivateItems(projectId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('private_items')
            .select('*')
            .eq('project_id', projectId)
            .eq('owner_user_id', user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createPrivateItem(projectId: string, title: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('private_items')
            .insert({
                project_id: projectId,
                owner_user_id: user.id,
                title
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePrivateItem(itemId: string, updates: any) {
        const { error } = await supabase
            .from('private_items')
            .update(updates)
            .eq('id', itemId);
        if (error) throw error;
    },

    async deletePrivateItem(itemId: string) {
        const { error } = await supabase
            .from('private_items')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
    },

    // ONLINE PROJECTS
    async getOnlineProjects(organizationId: string) {
        const { data, error } = await supabase
            .from('online_projects')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createOnlineProject(organizationId: string, title: string) {
        const { data, error } = await supabase.rpc('create_online_project', {
            p_organization_id: organizationId,
            p_title: title
        });

        if (error) throw error;
        return data;
    },

    // ONLINE ITEMS
    async getOnlineItems(projectId: string) {
        const { data, error } = await supabase
            .from('online_items')
            .select('*')
            .eq('online_project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createOnlineItem(projectId: string, title: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('online_items')
            .insert({
                online_project_id: projectId,
                created_by_user_id: user.id,
                title
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateOnlineItem(itemId: string, updates: any) {
        const { error } = await supabase
            .from('online_items')
            .update(updates)
            .eq('id', itemId);
        if (error) throw error;
    },

    async deleteOnlineItem(itemId: string) {
        const { error } = await supabase
            .from('online_items')
            .delete()
            .eq('id', itemId);
        if (error) throw error;
    },

    async isOnlineProjectMember(projectId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const result = { role: 'member', email: user.email };

        // 1. Check if user is the owner in the project table
        const { data: project } = await supabase
            .from('online_projects')
            .select('owner_user_id')
            .eq('id', projectId)
            .maybeSingle();

        if (project && project.owner_user_id === user.id) {
            return { ...result, role: 'owner' };
        }

        // 2. Check if user is a member in the members table
        const { data: member } = await supabase
            .from('online_project_members')
            .select('id')
            .eq('online_project_id', projectId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (member) {
            return result;
        }

        return null;
    },

    async shareOnlineProject(projectId: string, email: string) {
        const { error } = await supabase.rpc('add_online_project_member_by_email', {
            p_online_project_id: projectId,
            p_member_email: email
        });
        if (error) throw error;
    },

    async getOnlineProjectMembers(projectId: string) {
        const { data, error } = await supabase.rpc('list_online_project_members', {
            p_online_project_id: projectId
        });

        if (error) throw error;
        return data;
    },

    async removeOnlineProjectMember(projectId: string, email: string) {
        const { error } = await supabase.rpc('remove_online_project_member_by_email', {
            p_online_project_id: projectId,
            p_member_email: email
        });
        if (error) throw error;
    }
};

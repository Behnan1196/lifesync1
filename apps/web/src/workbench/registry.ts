export interface ToolConfig {
    id: string;
    nameKey: string;
    icon: string;
    isSystem?: boolean;
}

export const TOOLS_REGISTRY: Record<string, ToolConfig> = {
    superadmin: {
        id: 'superadmin',
        nameKey: 'tool.superadmin',
        icon: 'ShieldAlert',
        isSystem: true,
    },
    tools: {
        id: 'tools',
        nameKey: 'tool.tools',
        icon: 'Grid',
        isSystem: true,
    },
    agenda: {
        id: 'agenda',
        nameKey: 'tool.agenda',
        icon: 'Calendar',
    },
    pm: {
        id: 'pm',
        nameKey: 'tool.pm',
        icon: 'LayoutGrid',
    },
    habit: {
        id: 'habit',
        nameKey: 'tool.habit',
        icon: 'CheckCircle',
    },
    comm: {
        id: 'comm',
        nameKey: 'tool.comm',
        icon: 'MessageSquare',
    },
    hospital: {
        id: 'hospital',
        nameKey: 'tool.hospital',
        icon: 'Activity',
    },
    shopping: {
        id: 'shopping',
        nameKey: 'tool.shopping',
        icon: 'ShoppingCart',
    },
    inventory: {
        id: 'inventory',
        nameKey: 'tool.inventory',
        icon: 'Archive',
    },
    coaching: {
        id: 'coaching',
        nameKey: 'tool.coaching',
        icon: 'Users',
    },
};

export const ASSIGNABLE_TOOLS = ['agenda', 'pm', 'habit', 'comm', 'hospital', 'shopping', 'inventory', 'coaching'];

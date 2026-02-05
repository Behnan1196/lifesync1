import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'src', 'server', 'entitlements.store.json');

interface EntitlementsStore {
    version: number;
    defaults: { tools: string[] };
    overrides: Record<string, { tools: string[] }>;
}

export function getStore(): EntitlementsStore {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            return { version: 1, defaults: { tools: [] }, overrides: {} };
        }
        const data = fs.readFileSync(STORE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading entitlements store:', error);
        return { version: 1, defaults: { tools: [] }, overrides: {} };
    }
}

export function saveStore(store: EntitlementsStore) {
    try {
        const dir = path.dirname(STORE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving entitlements store:', error);
        throw error;
    }
}

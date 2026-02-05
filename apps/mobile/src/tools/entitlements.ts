import { fetchWithAuth } from '../core/http';
import { hasWebBackend } from '../core/env';

export type EntitlementsResponse = {
  tools: string[];
  source: 'default' | 'override';
};

export type EntitlementsResult =
  | { success: true; data: EntitlementsResponse }
  | { success: false; reason: 'no_backend' | 'fetch_error' };

export async function fetchEntitlements(accessToken: string): Promise<EntitlementsResult> {
  if (!hasWebBackend()) {
    return { success: false, reason: 'no_backend' };
  }

  try {
    const response = await fetchWithAuth('/api/entitlements/me', accessToken);
    
    if (!response.ok) {
      return { success: false, reason: 'fetch_error' };
    }

    const data: EntitlementsResponse = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, reason: 'fetch_error' };
  }
}

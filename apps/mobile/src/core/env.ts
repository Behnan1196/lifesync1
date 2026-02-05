export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL || '',
};

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!ENV.SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!ENV.SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function hasWebBackend(): boolean {
  return ENV.WEB_BASE_URL.length > 0;
}

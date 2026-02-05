import { ENV } from './env';

export async function fetchWithAuth(
  path: string,
  accessToken: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${ENV.WEB_BASE_URL}${path}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

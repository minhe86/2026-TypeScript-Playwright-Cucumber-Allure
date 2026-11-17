import type { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl, readApiConfig } from './config.ts';
import { requireApiCredentials } from '../../../../api/utils/config.ts';
export async function getAuthToken(request: APIRequestContext): Promise<string> {
    const config = readApiConfig();
    const user = typeof config === 'object' && config !== null && 'user' in config ? config.user : undefined;
    const { email, password } = requireApiCredentials(
        typeof user === 'object' && user !== null && 'email' in user ? user.email : undefined,
        typeof user === 'object' && user !== null && 'password' in user ? user.password : undefined,
    );

    const response = await request.post(new URL('/api/login', getApiBaseUrl()).toString(), {
        data: {
            email,
            password
        }
    });

    if (response.ok()) {
        const data = await response.json();
        const token: unknown = data.token;
        if (typeof token !== 'string' || !token) {
            throw new Error('Token not found!');
        }
        return token;
    } else {
        throw new Error('Failed to retrieve token: ' + response.status());
    }
}

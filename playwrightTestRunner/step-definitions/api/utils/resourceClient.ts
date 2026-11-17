import type { APIRequestContext } from '@playwright/test';
import { getApiBaseUrl } from './config.ts';

export async function createUsersResource(request: APIRequestContext, resourceData: { firstName: string; email: string }) {
    const response = await request.post(new URL('/api/users', getApiBaseUrl()).toString(), {
        data: resourceData
    });

    if (response.ok()) {
        return response;
    } else {
        throw new Error(`Failed to create new user, status is ${response.status()}.`);
    }
}

export async function getUsersResourceByResourceId(request: APIRequestContext, resourceId: number) {
    const response = await request.get(new URL(`/api/users/${resourceId}`, getApiBaseUrl()).toString());
    if (response.ok()) {
        return response;
    } else {
        throw new Error(`Failed to get the user by resourceId, status is ${response.status()}.`);
    }
}

export async function createRegisterResource(request: APIRequestContext, resourceData: { email?: string; password?: string }) {
    const response = await request.post(new URL('/api/register', getApiBaseUrl()).toString(), {
        data: resourceData
    });
    return response;
}

import type { APIRequestContext } from '@playwright/test';

export async function createUsersResource(request: APIRequestContext, resourceData: { firstName: string; email: string }) {
    const response = await request.post('https://reqres.in/api/users', {
        // seems token is not needed here, should inherit from the context.
        // headers: {
        //     Authorization: `Bearer ${token}`
        //   },
        data: {
            resourceData
        }
    });

    if (response.ok()) {
        return response;
    } else {
        throw new Error(`Failed to create new user, status is ${response.status()}.`);
    }
}

export async function getUsersResourceByResourceId(request: APIRequestContext, resourceId: number) {
    const response = await request.get(`https://reqres.in/api/users/${resourceId}`);
    if (response.ok()) {
        return response;
    } else {
        throw new Error(`Failed to get the user by resourceId, status is ${response.status()}.`);
    }
}

export async function createRegisterResource(request: APIRequestContext, resourceData: { email?: string; password?: string }) {
    const response = await request.post('https://reqres.in/api/register', {
        data: {
            resourceData
        }
    });
    return response;
}

import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { getAuthToken } from './utils/auth.ts';
import { createUsersResource, getUsersResourceByResourceId } from './utils/resourceClient.ts';

test.describe.configure({ mode: 'serial' });
test.describe('User(s) Resource Tests', () => {
  const projectRootDir = process.cwd();
  const configFilePath = path.join(projectRootDir, 'configs', 'config.api.json');
  const jsonData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));

  const { email, firstName } = jsonData.user;
  let token;
  let resourceId: number;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
    expect(token).not.toBeNull();
  });

  const testDescription1 = `User creates a new user resource with name ${firstName} and email ${email}`;
  test(testDescription1, async ({ request }) => {

    const resourceData = { firstName, email };
    const apiResponse = await createUsersResource(request, resourceData);
    expect(apiResponse.status()).toEqual(201);

    const apiData = await apiResponse.json();
    resourceId = apiData.id;
    // Have to assign existing user.id for the new user because https://reqres.in/ only getting existing users for demonstration.
    resourceId = 7;
  });

  const testDescription2 = `User could retrieve the user resource by ID, resource details should match name ${firstName} and email ${email}`;
  test(testDescription2, async ({ request }) => {

    const apiResponse = await getUsersResourceByResourceId(request, resourceId);
    expect(apiResponse.status()).toEqual(200);

    const apiData = await apiResponse.json();
    expect(apiData.data.email).toEqual(email);
    expect(apiData.data.first_name).toEqual(firstName);
  });

});

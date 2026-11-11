import { test, expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import { getAuthToken } from './utils/auth.ts';
import { createRegisterResource } from './utils/resourceClient.ts';

test.describe.configure({ mode: 'serial' });
test.describe('Register resource with invalid data Tests', () => {
  let apiResponse: APIResponse;
  let token;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
    expect(token).not.toBeNull();
    test.info().attach('Test Data:', {
      body: token,
      contentType: 'text/plain',
    });
  });

  [{}, { "email": "sydney@fife" }, { "password": "test" }].forEach((invalidData, index) => {
    const testDescription1 = `Iteration ${index + 1} - User attempts to create a register resource with invalid data ${JSON.stringify(invalidData)}`;
    test(testDescription1, async ({ request }) => {
      test.info().attach('Test Data:', {
        body: JSON.stringify(invalidData),
        contentType: 'application/json',
      });

      apiResponse = await createRegisterResource(request, invalidData);
    });

    const testDescription2 = `Iteration ${index + 1} - The register API should return a 400 error when with invalid data ${JSON.stringify(invalidData)}`;
    test(testDescription2, async ({ request }) => {
      test.info().attach('Test Data:', {
        body: JSON.stringify(invalidData),
        contentType: 'application/json',
      });

      expect(apiResponse).toBeTruthy();
      expect(apiResponse.status()).toEqual(400);
    });
  });

});

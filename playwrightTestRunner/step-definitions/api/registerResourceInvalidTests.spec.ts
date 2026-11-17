import { test, expect } from "@playwright/test";
import { getAuthToken } from "./utils/auth.ts";
import { createRegisterResource } from "./utils/resourceClient.ts";

test.describe("Register resource with invalid data", () => {
  test.beforeAll(async ({ request }) => {
    await getAuthToken(request);
  });

  const invalidCases = [
    { name: "empty data", data: {} },
    { name: "missing password", data: { email: "sydney@fife" } },
    { name: "missing email", data: { password: "test" } },
  ];

  for (const { name, data } of invalidCases) {
    test(`returns a 400 error for ${name}`, async ({ request }) => {
      const response = await createRegisterResource(request, data);
      expect(response.status()).toEqual(400);
    });
  }
});

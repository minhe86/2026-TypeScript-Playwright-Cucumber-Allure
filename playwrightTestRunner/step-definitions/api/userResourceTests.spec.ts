import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import { getAuthToken } from "./utils/auth.ts";
import { createUsersResource, getUsersResourceByResourceId } from "./utils/resourceClient.ts";

test.describe("User resource tests", () => {
  const configFilePath = path.join(process.cwd(), "configs", "config.api.json");
  const jsonData = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  const { email, firstName } = jsonData.user;

  test.beforeAll(async ({ request }) => {
    await getAuthToken(request);
  });

  test("creates a user resource", async ({ request }) => {
    const response = await createUsersResource(request, { firstName, email });
    expect(response.status()).toEqual(201);
  });

  test("retrieves an existing user resource", async ({ request }) => {
    const response = await getUsersResourceByResourceId(request, 7);
    expect(response.status()).toEqual(200);

    const apiData = await response.json();
    expect(apiData.data.email).toEqual(email);
    expect(apiData.data.first_name).toEqual(firstName);
  });
});

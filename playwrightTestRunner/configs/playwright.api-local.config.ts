import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../step-definitions/api",
  reporter: "list",
  forbidOnly: true,
  retries: 0,
  workers: 1,
});

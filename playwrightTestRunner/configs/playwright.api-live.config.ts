import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config.ts";
import { createReporters } from "./reporters.ts";

export default defineConfig({
  ...browserConfig,
  testDir: "../step-definitions/api",
  projects: [{ name: "API" }],
  reporter: createReporters("../api-html-results"),
  workers: 1,
});

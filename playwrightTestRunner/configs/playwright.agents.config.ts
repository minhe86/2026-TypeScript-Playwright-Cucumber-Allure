import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config.ts";

const chromeProject = browserConfig.projects?.find((project) => project.name === "Google Chrome");
if (!chromeProject) {
  throw new Error("The Google Chrome project is required for Playwright Test Agents");
}

export default defineConfig({
  ...browserConfig,
  testIgnore: [],
  projects: [chromeProject],
  reporter: "list",
});

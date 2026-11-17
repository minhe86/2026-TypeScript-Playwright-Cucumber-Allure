import type { ReporterDescription } from "@playwright/test";

export function createReporters(htmlOutputFolder: string): ReporterDescription[] {
  return [
    ["html", { outputFolder: htmlOutputFolder, open: process.env.CI ? "never" : "on-failure" }],
    ["list"],
    ["allure-playwright", { resultsDir: "allure-results/playwright" }],
  ];
}

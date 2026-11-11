import { defineConfig, devices,} from "@playwright/test";
import './test.setup.ts'; 

export default defineConfig({
  timeout: 1 * 60 * 1000, 
  globalTimeout: 2 * 60 * 1000,
  expect: {
    timeout: 40 * 1000,
  },
  testDir: "../step-definitions/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ["html", { outputFolder: "../html-results", open: "always" }],
    ["list"],
    ["allure-playwright", { outputFolder: "allure-results" }],
  ],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    // trace: "on-first-retry",
    trace: "retain-on-failure",
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // {
    //   name: "chromium",
    //   use: { ...devices["Desktop Chrome"] },
    // },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

});

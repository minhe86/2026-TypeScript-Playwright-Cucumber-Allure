import { BeforeAll, Before, After, AfterStep } from "@cucumber/cucumber";
import playwright from "playwright";
import { ContentType } from "allure-js-commons";
import _ from 'lodash';
import nconf from 'nconf';
import type { ScenarioWorld } from './world.ts';

// Load the config file before all tests
BeforeAll(async function () {
  nconf
      .env({
        transform: ({ key, value }: { key: string; value: string }) => {
          return { key, value: _.includes(['true', 'false'], value) ? JSON.parse(value) : value };
        },
      })
      .argv()
      .file('default', './configs/config.default.json');
});

Before<ScenarioWorld>(async function () {
  this.browser = await playwright.chromium.launch({
    headless: nconf.get("headless"),
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
  });
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
});

After<ScenarioWorld>(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});

AfterStep<ScenarioWorld>(async function (step ) {
  if (step.result.status !== "PASSED") {
    try {
      await this.attach(`FAILED Step: ${step.pickleStep.text}`, ContentType.TEXT);
      const screenshot = await this.page.screenshot();
      await this.attach(screenshot, ContentType.PNG);
    } catch (error) {
      console.error(
        "Failed to capture screenshot or attach step details:",
        error
      );
    }
  }
});

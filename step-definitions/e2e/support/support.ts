import { Before, After, AfterStep, setDefaultTimeout } from "@cucumber/cucumber";
import playwright from "playwright";
import { ContentType } from "allure-js-commons";
import nconf from 'nconf';
import "../../../configs/browser.ts";
import type { ScenarioWorld } from './world.ts';

const timeoutValue: unknown = nconf.get("cucumberTimeout:default");
const timeout = typeof timeoutValue === "string" && timeoutValue.trim() !== ""
  ? Number(timeoutValue)
  : timeoutValue;
if (typeof timeout !== "number" || !Number.isInteger(timeout) || timeout <= 0 || timeout > 2_147_483_647) {
  throw new Error("cucumberTimeout.default must be a positive integer in milliseconds no greater than 2147483647");
}
setDefaultTimeout(timeout);

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

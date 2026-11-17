import { test } from "@playwright/test";
import { launchAppUrl } from "./utils/common.ts";

test("seed", async ({ page }) => {
  await launchAppUrl(page);
});

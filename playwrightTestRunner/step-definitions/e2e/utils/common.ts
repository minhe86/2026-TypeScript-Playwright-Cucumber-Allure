import type { Page } from "playwright";
import UIPage from "../../../../pages/components/UIPage.ts"
import LoginPage from "../../../../pages/Login.ts";
import { getPageClass } from "../../../../pages/pageRegistry.ts";

export async function launchAppUrl(page: Page) {
    if (!page) {
        throw new Error("Playwright page is not initialized");
      }
      const e2ePage = await UIPage.create(page);
      await e2ePage.openUrl();
      await LoginPage.create(page);
}

export async function beDirectedToPage(page: Page, pageName: string) {
      await getPageClass(pageName).create(page);
}


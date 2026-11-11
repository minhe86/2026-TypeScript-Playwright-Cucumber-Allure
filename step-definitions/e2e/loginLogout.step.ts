import _ from "lodash";
import { Given, When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import type { DataTable } from "@cucumber/cucumber";
import UIPage from "../../pages/components/UIPage.ts";
import SideNavigationMenu from "../../pages/components/SideNavigationMenu.ts";
import LoginPage from "../../pages/Login.ts";
import HomePage from "../../pages/Home.ts";
import { getPageClass } from "../../pages/pageRegistry.ts";
import CheckoutCartPage from "../../pages/CheckoutCart.ts";
import CheckoutOverviewPage from "../../pages/CheckoutOverview.ts";
import type { ScenarioWorld } from "./support/world.ts";
import { getRequiredTableValue } from "./support/dataTable.ts";
import nconf from "nconf";

setDefaultTimeout(nconf.get("cucumberTimeout:default"));

Given<ScenarioWorld>("User launches SwagLabs application URL", async function () {
  if (!this.page) {
    throw new Error("this.page is not initialized");
  }
  const e2ePage = await UIPage.create(this.page);
  await e2ePage.openUrl();
  await LoginPage.create(this.page);
});

When<ScenarioWorld>(
  "User logs in the app using username {string} and password {string}",
  async function (username: string, password: string) {
    const loginPage = await LoginPage.create(this.page);
    await loginPage.loginApplication(username, password);
  }
);

Then<ScenarioWorld>("User is directed to {string} page", async function (pageName: string) {
  await getPageClass(pageName).create(this.page);
});

When<ScenarioWorld>(
  "Standard/Problem/PeformanceGlitch/Error/Visual user logs in",
  async function (detailsTable: DataTable) {
    const loginPage = await LoginPage.create(this.page);
    const username = getRequiredTableValue(detailsTable, "username");
    const password = getRequiredTableValue(detailsTable, "password");
    await loginPage.loginApplication(username, password);
  }
);

Then<ScenarioWorld>(
  "User can see error message for {string} and {string} on Login page",
  async function (username: string, password: string) {
    const loginPage = await LoginPage.create(this.page);
    await loginPage.verifyLoginErrorMessage(username, password);
  }
);

When<ScenarioWorld>("User logs out", async function () {
  const homePage = await HomePage.create(this.page);
  await homePage.navigateToSideMenu();

  const sideNavigationMenu = await SideNavigationMenu.create(this.page);
  await sideNavigationMenu.logout();
});

Then<ScenarioWorld>("User can see details on {string} page", async function (pageName: string) {
  switch (pageName) {
    case "Login":
    case "Home":
    case "Checkout Information":
    case "Checkout Complete": {
      await getPageClass(pageName).create(this.page);
      return;
    }
    case "Checkout Cart": {
      const selectedProducts = _.filter(this.products, ['selected', true]);
      const page = await CheckoutCartPage.create(this.page);
      await page.verifyPageDetails(selectedProducts);
      return;
    }
    case "Checkout Overview": {
      const selectedProducts = _.filter(this.products, ['selected', true]);
      const page = await CheckoutOverviewPage.create(this.page);
      await page.verifyPageDetails(selectedProducts);
      return;
    }
    default: {
      const page = await getPageClass(pageName).create(this.page);
      if (page instanceof SideNavigationMenu) {
        await page.verifyPageDetails();
        return;
      }
      throw new Error(`Page details cannot be verified for ${pageName}`);
    }
  }
});

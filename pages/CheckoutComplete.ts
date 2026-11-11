import UIPage from "./components/UIPage.ts";
import { expect } from "@playwright/test";

export default class CheckoutCompletePage extends UIPage {
  backHomeButton = "[data-test='back-to-products']";

  waitForDisplayed = async () => {
    await this.page.locator(this.backHomeButton).waitFor();
  };

  clickBackHome = async () => {
    expect(await this.page.locator(this.backHomeButton).isEnabled()).toBeTruthy();
    await this.page.locator(this.backHomeButton).click();
  };
}

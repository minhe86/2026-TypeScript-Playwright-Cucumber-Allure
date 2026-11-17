import UIPage from "./components/UIPage.ts";

export default class CheckoutCompletePage extends UIPage {
  backHomeButton = "[data-test='back-to-products']";

  waitForDisplayed = async () => {
    await this.page.locator(this.backHomeButton).waitFor();
  };

  clickBackHome = async () => {
    await this.page.locator(this.backHomeButton).click();
  };
}

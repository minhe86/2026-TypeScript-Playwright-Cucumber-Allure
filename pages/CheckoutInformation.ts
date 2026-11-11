import UIPage from "./components/UIPage.ts";
import { expect } from "@playwright/test";

export default class CheckoutInformationPage extends UIPage {
  firstNameText = "[data-test='firstName']";
  lastNameText = "[data-test='lastName']";
  postalCodeText = "[data-test='postalCode']";
  cancelButton = "[data-test='cancel']";
  continueButton = "[data-test='continue']";

  waitForDisplayed = async () => {
    await this.page.locator(this.cancelButton).waitFor();
    await this.page.locator(this.continueButton).waitFor();
  };

  inputInformation = async (username: string, lastname: string, zipcode: string) => {
    await this.page.locator(this.firstNameText).fill(username);
    await this.page.locator(this.lastNameText).fill(lastname);
    await this.page.locator(this.postalCodeText).fill(zipcode);
  };

  clickContinue = async () => {
    expect(await this.page.locator(this.continueButton).isEnabled()).toBeTruthy();
    await this.page.locator(this.continueButton).click();
  };
}

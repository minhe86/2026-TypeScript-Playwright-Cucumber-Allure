import UIPage from "./components/UIPage.ts";
import { expect } from "@playwright/test";

export default class LoginPage extends UIPage {
  username = "input#user-name";
  password = "input#password";
  loginButton = "input#login-button";
  errorMessageForUsrPw = "Epic sadface: Username and password do not match any user in this service";
  errorMessageForLockedUsr = "Epic sadface: Sorry, this user has been locked out."

  waitForDisplayed = async () => {
    await this.page.locator(this.username).waitFor();
    await this.page.locator(this.password).waitFor();
    await this.page.locator(this.loginButton).waitFor();
  };

  loginApplication = async (user: string, passwd: string) => {
    await this.page.locator(this.username).fill(user);
    await this.page.locator(this.password).fill(passwd);
    await this.page.click(this.loginButton);
  };

  verifyLoginErrorMessage = async (user: string, passwd: string) => {
    if (user === "locked_out_user" && passwd === "secret_sauce") {
      expect(await this.page.locator("div.error-message-container").innerText()).toContain(this.errorMessageForLockedUsr);
    }
    else {
      expect(await this.page.locator("div.error-message-container").innerText()).toContain(this.errorMessageForUsrPw);
    }
  }

  verifyPageDetails = async () => {
    expect(await this.page.url()).toContain("www.saucedemo.com");
    expect(await this.page.title()).toContain("Swag Labs");

    expect(await this.page.isEditable(this.username)).toBeTruthy();
    expect(await this.page.isEditable(this.password)).toBeTruthy();
    if (!(await this.page.isVisible(this.loginButton))) {
      throw new Error("Login button is not visiable");
    }
  };
}

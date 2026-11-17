import { test } from "@playwright/test";
import { launchAppUrl, beDirectedToPage } from "./utils/common.ts";
import LoginPage from "../../../pages/Login.ts";

const cases = [
  { name: "incorrect password", username: "standard_user", password: "randomPW" },
  { name: "unknown user", username: "randomUser", password: "secret_sauce" },
  { name: "locked user", username: "locked_out_user", password: "secret_sauce" },
];

test.describe("Verify error messages for invalid users", () => {
  for (const { name, username, password } of cases) {
    test(`shows the login error for ${name}`, async ({ page }) => {
      await test.step("Open the login page", async () => {
        await launchAppUrl(page);
        await beDirectedToPage(page, "Login");
      });

      const loginPage = await LoginPage.create(page);
      await test.step("Submit invalid credentials", async () => {
        await loginPage.loginApplication(username, password);
      });

      await test.step("Verify the error message", async () => {
        await loginPage.verifyLoginErrorMessage(username, password);
        await test.info().attach("Login error screenshot", {
          body: await page.screenshot({
            mask: [page.locator(loginPage.username), page.locator(loginPage.password)],
          }),
          contentType: "image/png",
        });
      });
    });
  }
});

test.describe("Login error assertions", () => {
  const delayedErrors = [
    {
      name: "invalid credentials",
      username: "standard_user",
      password: "randomPW",
      message: "Epic sadface: Username and password do not match any user in this service",
    },
    {
      name: "locked user",
      username: "locked_out_user",
      password: "secret_sauce",
      message: "Epic sadface: Sorry, this user has been locked out.",
    },
  ];

  for (const { name, username, password, message } of delayedErrors) {
    test(`waits for the ${name} error message`, async ({ page }) => {
      await page.setContent('<div class="error-message-container"><h3 role="alert">Loading</h3></div>');
      await page.evaluate((text) => {
        setTimeout(() => { document.querySelector('[role="alert"]')!.textContent = text; }, 300);
      }, message);

      await new LoginPage(page).verifyLoginErrorMessage(username, password);
    });
  }
});

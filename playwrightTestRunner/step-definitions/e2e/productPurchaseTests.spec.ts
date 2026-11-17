import _ from "lodash";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { faker } from "@faker-js/faker";
import nconf from "nconf";
import { launchAppUrl, beDirectedToPage } from "./utils/common.ts";
import SideNavigationMenu from "../../../pages/components/SideNavigationMenu.ts";
import LoginPage from "../../../pages/Login.ts";
import HomePage from "../../../pages/Home.ts";
import CheckoutCartPage from "../../../pages/CheckoutCart.ts";
import CheckoutCompletePage from "../../../pages/CheckoutComplete.ts";
import CheckoutInformationPage from "../../../pages/CheckoutInformation.ts";
import CheckoutOverviewPage from "../../../pages/CheckoutOverview.ts";
import { getProducts, Product } from "../../../data/utils.ts";

const checkoutActions = [
  { name: "checkout", testId: "checkout", click: (page: Page) => new CheckoutCartPage(page).checkout() },
  { name: "continue", testId: "continue", click: (page: Page) => new CheckoutInformationPage(page).clickContinue() },
  { name: "finish", testId: "finish", click: (page: Page) => new CheckoutOverviewPage(page).clickFinish() },
  { name: "back home", testId: "back-to-products", click: (page: Page) => new CheckoutCompletePage(page).clickBackHome() },
];

for (const { name, testId, click } of checkoutActions) {
  test(`checkout ${name} waits for the button to become enabled`, async ({ page }) => {
    await page.setContent(`<button data-test="${testId}" disabled>Continue</button>`);
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>("button")!;
      button.addEventListener("click", () => { button.dataset.clicked = "true"; });
      setTimeout(() => { button.disabled = false; }, 300);
    });

    await click(page);
    await expect(page.locator("button")).toHaveAttribute("data-clicked", "true");
  });
}

for (const testId of ["continue-shopping", "checkout"]) {
  test(`cart details wait for the ${testId} button to appear`, async ({ page }) => {
    await page.route("https://example.test/cart.html", (route) => route.fulfill({
      contentType: "text/html",
      body: `<title>Swag Labs</title>
        <button data-test="continue-shopping">Continue shopping</button>
        <button data-test="checkout">Checkout</button>`,
    }));
    await page.goto("https://example.test/cart.html");
    await page.evaluate((id) => {
      const button = document.querySelector<HTMLButtonElement>(`[data-test="${id}"]`)!;
      button.hidden = true;
      setTimeout(() => { button.hidden = false; }, 300);
    }, testId);

    await new CheckoutCartPage(page).verifyPageDetails([]);
  });
}

for (const testId of ["finish", "cancel"]) {
  test(`checkout overview waits for the ${testId} button to appear`, async ({ page }) => {
    await page.setContent(`
      <title>Swag Labs</title>
      <button data-test="finish">Finish</button>
      <button data-test="cancel">Cancel</button>
      <div data-test="subtotal-label">Item total: $0.00</div>
    `);
    await page.evaluate((id) => {
      const button = document.querySelector<HTMLButtonElement>(`[data-test="${id}"]`)!;
      button.hidden = true;
      setTimeout(() => { button.hidden = false; }, 300);
    }, testId);

    await new CheckoutOverviewPage(page).verifyPageDetails([]);
  });
}

test("cart product checks wait for the displayed details to update", async ({ page }) => {
  await page.setContent(`
    <div class="cart_item">
      <a id="item_4_title_link">Other product</a>
      <div class="inventory_item_price">$9.99</div>
      <button>Remove</button>
    </div>
    <div class="cart_item">
      <a id="item_1_title_link">Loading</a>
      <div class="inventory_item_price">Loading</div>
      <button disabled>Loading</button>
    </div>
  `);
  await page.evaluate(() => {
    const item = document.querySelectorAll(".cart_item")[1]!;
    setTimeout(() => { item.querySelector("a")!.textContent = "Backpack"; }, 300);
    setTimeout(() => { item.querySelector(".inventory_item_price")!.textContent = "$29.99"; }, 900);
    setTimeout(() => { item.querySelector("button")!.disabled = false; }, 1500);
    setTimeout(() => { item.querySelector("button")!.textContent = "Remove"; }, 2100);
  });

  await new CheckoutCartPage(page).verifyCheckoutProductDetails(
    new Product(1, "Backpack", 29.99, "A useful bag")
  );
});

test("checkout overview checks wait for the displayed details to update", async ({ page }) => {
  await page.setContent(`
    <div class="cart_item_label">
      <a id="item_4_title_link">Other product</a>
      <div class="inventory_item_price">$9.99</div>
      <button>Remove</button>
    </div>
    <div class="cart_item_label">
      <a id="item_1_title_link">Loading</a>
      <div class="inventory_item_price">Loading</div>
      <button>Remove</button>
    </div>
    <div data-test="subtotal-label">Loading</div>
  `);
  await page.evaluate(() => {
    const item = document.querySelectorAll(".cart_item_label")[1]!;
    setTimeout(() => { item.querySelector("a")!.textContent = "Backpack"; }, 300);
    setTimeout(() => { item.querySelector(".inventory_item_price")!.textContent = "$29.99"; }, 900);
    setTimeout(() => { item.querySelector("button")!.remove(); }, 2400);
    setTimeout(() => {
      document.querySelector('[data-test="subtotal-label"]')!.textContent = "Item total: $39.98";
    }, 3200);
  });

  const overview = new CheckoutOverviewPage(page);
  const backpack = new Product(1, "Backpack", 29.99, "A useful bag");
  await overview.verifyCheckoutProductDetails(backpack);
  await overview.verifyCheckoutInfoDetails([
    backpack,
    new Product(4, "Other product", 9.99, ""),
  ]);
});

test("User logs in, purchases products, and logs out", async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  await test.step("Open the application and verify the login page", async () => {
    await launchAppUrl(page);
    await beDirectedToPage(page, "Login");
  });

  await test.step("Log in and verify the home page", async () => {
    const loginPage = await LoginPage.create(page);
    await loginPage.loginApplication(
      nconf.get("standardUsername"),
      nconf.get("passwordFallUsers")
    );
    await beDirectedToPage(page, "Home");
  });

  const products = await test.step("Verify product details", async () => {
    const filePath = "data/products.csv";
    const productIndex = 2;
    const products = await getProducts(filePath);
    const selectedProduct = _.find(products, { productNo: productIndex });
    if (!selectedProduct) {
      throw new Error(`Product ${productIndex} not found in ${filePath}`);
    }
    await test.info().attach("Product data", {
      body: JSON.stringify(selectedProduct),
      contentType: "application/json",
    });

    const homePage = await HomePage.create(page);
    await homePage.verifyProductDetails(selectedProduct);
    return products;
  });

  await test.step("Add products to the cart", async () => {
    const productIndexes = [0, 2];
    const selectedProducts = products.filter((_, index) => productIndexes.includes(index));
    const homePage = await HomePage.create(page);
    for (const product of selectedProducts) {
      await homePage.addProductToCart(product);
      product.selected = true;
    }
    await test.info().attach("Selected products", {
      body: JSON.stringify(selectedProducts),
      contentType: "application/json",
    });
  });

  await test.step("Verify the cart and proceed to checkout", async () => {
    const homePage = await HomePage.create(page);
    await homePage.navigateToShoppingCart();
    await beDirectedToPage(page, "Checkout Cart");
    const checkoutCartPage = await CheckoutCartPage.create(page);
    await checkoutCartPage.verifyPageDetails(_.filter(products, ["selected", true]));
    await checkoutCartPage.checkout();
  });

  await test.step("Enter checkout information", async () => {
    await beDirectedToPage(page, "Checkout Information");
    const checkoutInformationPage = await CheckoutInformationPage.create(page);
    await checkoutInformationPage.inputInformation(
      faker.person.firstName(),
      faker.person.lastName(),
      faker.location.zipCode()
    );
    await checkoutInformationPage.clickContinue();
  });

  await test.step("Verify the order and complete the purchase", async () => {
    await beDirectedToPage(page, "Checkout Overview");
    const checkoutOverviewPage = await CheckoutOverviewPage.create(page);
    const selectedProducts = _.filter(products, ["selected", true]);
    await checkoutOverviewPage.verifyPageDetails(selectedProducts);
    await test.info().attach("Checkout screenshot", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await test.info().attach("Selected products", {
      body: JSON.stringify(selectedProducts),
      contentType: "application/json",
    });
    await checkoutOverviewPage.clickFinish();
  });

  await test.step("Return home and log out", async () => {
    await beDirectedToPage(page, "Checkout Complete");
    const checkoutCompletePage = await CheckoutCompletePage.create(page);
    await checkoutCompletePage.clickBackHome();
    const homePage = await HomePage.create(page);
    await homePage.navigateToSideMenu();
    const sideNavigationMenu = await SideNavigationMenu.create(page);
    await sideNavigationMenu.logout();
    await beDirectedToPage(page, "Login");
  });
});

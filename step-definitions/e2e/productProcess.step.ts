import _ from "lodash";
import { When, setDefaultTimeout } from "@cucumber/cucumber";
import type { DataTable } from "@cucumber/cucumber";
import { ContentType } from "allure-js-commons";
import HomePage from "../../pages/Home.ts";
import CheckoutCartPage from "../../pages/CheckoutCart.ts";
import CheckoutCompletePage from "../../pages/CheckoutComplete.ts";
import CheckoutInformationPage from "../../pages/CheckoutInformation.ts";
import CheckoutOverviewPage from "../../pages/CheckoutOverview.ts";
import { getProducts } from "../../data/utils.ts";
import nconf from "nconf";
import type { ScenarioWorld } from "./support/world.ts";
import { getRequiredTableValue } from "./support/dataTable.ts";

setDefaultTimeout(nconf.get("cucumberTimeout:default"));

When<ScenarioWorld>("User verifies the product name {string}", async function (productName: string) {
  const homePage = await HomePage.create(this.page);
  await homePage.verifyProductName1(productName);
});

When<ScenarioWorld>(
  "User verifies the product details of product {int} on Home page",
  async function (productIndex: number) {
    const filePath = "data/products.csv";
    const products = await getProducts(filePath);
    const selectedProduct = _.find(products, { productNo: productIndex });
    if (!selectedProduct) {
      throw new Error(`Product ${productIndex} not found in ${filePath}`);
    }
    await this.attach(
      `Test Data: ${JSON.stringify(selectedProduct, null, 2)}`,
      ContentType.TEXT
    );

    const homePage = await HomePage.create(this.page);
    await homePage.verifyProductDetails(selectedProduct);
    this.products = products;
  }
);

When<ScenarioWorld>("User verifies all products details on Home page", async function () {
  const filePath = "data/products.csv";
  const products = await getProducts(filePath);
  await this.attach(
    `Test Data: ${JSON.stringify(products, null, 2)}`,
    ContentType.TEXT
  );

  const homePage = await HomePage.create(this.page);
  await homePage.verifyProductsDetails(products);
  this.products = products;
});

When<ScenarioWorld>("User adds product(s) [{}] to the cart", async function (productsList: string) {
  const toSelectProducts = productsList.split(",").map((index) => {
    const productIndex = parseInt(index, 10);
    const product = this.products[productIndex];
    if (!product) {
      throw new Error(`Product index ${productIndex} not found`);
    }
    return product;
  });

  const homePage = await HomePage.create(this.page);
  for (const toSelectProduct of toSelectProducts) {
    await homePage.addProductToCart(toSelectProduct);
    if (!toSelectProduct.selected) {
      toSelectProduct.selected = true;
    }
  }
  await this.attach(
    `Test Data : ${JSON.stringify(toSelectProducts, null, 2)}`,
    ContentType.TEXT
  );

  // console.log(
  //   "after adding, products=" + JSON.stringify(this.products, null, 2)
  // );
});

When<ScenarioWorld>("User navigates to checkout", async function () {
  const homePage = await HomePage.create(this.page);
  await homePage.navigateToShoppingCart();
});

When<ScenarioWorld>("User checkouts product(s)", async function () {
  const checkoutCartPage = await CheckoutCartPage.create(this.page);
  await checkoutCartPage.checkout();
});

When<ScenarioWorld>("User inputs user information", async function (detailsTable: DataTable) {
  const username = getRequiredTableValue(detailsTable, "firstname");
  const lastname = getRequiredTableValue(detailsTable, "lastname");
  const zipcode = getRequiredTableValue(detailsTable, "zipcode");

  const checkoutInformationPage = await CheckoutInformationPage.create(this.page);
  await checkoutInformationPage.inputInformation(username, lastname, zipcode);
  await checkoutInformationPage.clickContinue();
});

When<ScenarioWorld>("User completes the purchase", async function () {
  const checkoutOverviewPage = await CheckoutOverviewPage.create(this.page);
  await checkoutOverviewPage.clickFinish();
});

When<ScenarioWorld>("User backs to Home Page", async function () {
  const checkoutCompletePage = await CheckoutCompletePage.create(this.page);
  await checkoutCompletePage.clickBackHome();
});
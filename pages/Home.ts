import UIPage from "./components/UIPage.ts";
import { expect } from "@playwright/test";
import type { Product } from "../data/utils.ts";

export default class HomePage extends UIPage {
  burgerMenu = "button#react-burger-menu-btn";
  shoppingCartLink = "  a.shopping_cart_link";


  getProductName = (productNo: number) => {
    return `a#item_${productNo}_title_link`;
  };

  getProductInverntoryLocators = async (productNo: number) => {
    const selectedInventoryLocator = this.page
      .locator("div.inventory_item_description")
      .filter({ has: this.page.locator(this.getProductName(productNo)) });
    return {
      productName: this.page.locator(this.getProductName(productNo)),
      productDescription: selectedInventoryLocator.locator(
        "div.inventory_item_desc"
      ),
      productPrice: selectedInventoryLocator.locator(
        "div.inventory_item_price"
      ),
      productAddRemoveButton: selectedInventoryLocator.locator("button"),
    };
  };

  waitForDisplayed = async () => {
    const product1Locators = await this.getProductInverntoryLocators(1);
    await product1Locators.productName.waitFor();
    await product1Locators.productDescription.waitFor();
    await product1Locators.productPrice.waitFor();
    await product1Locators.productAddRemoveButton.waitFor();
    await this.page.locator(this.burgerMenu).waitFor();
  };

  verifyPageDetails = async () => {
    expect(await this.page.url()).toContain("inventory.html");
    expect(await this.page.title()).toContain("Swag Labs");

    // verify product 1 details.
    const product1Locators =await this.getProductInverntoryLocators(1);
    if (!(await product1Locators.productName.isVisible())) {
      throw new Error("Product 1 is not visible");
    } else {
      expect(await product1Locators.productName.isVisible()).toBeTruthy();
      expect(
        await product1Locators.productDescription.isVisible()
      ).toBeTruthy();
      expect(await product1Locators.productPrice.isVisible()).toBeTruthy();
      expect(
        await product1Locators.productAddRemoveButton.isEnabled()
      ).toBeTruthy();
    }

    expect(await this.page.locator(this.burgerMenu).isEnabled()).toBeTruthy();
  };

  verifyProductName1 = async (productName: string) => {
    expect(await this.page.locator(this.getProductName(1)).textContent()).toBe(
      productName
    );
  };

  verifyProductDetails = async (product: Product) => {
    const productLocators = await this.getProductInverntoryLocators(
      product.productNo
    );

    expect(await productLocators.productName.textContent()).toBe(
      product.productName
    );
    expect(await productLocators.productDescription.textContent()).toBe(
      product.productDescription
    );
    const expectedPriceFormat =
      "$" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(product.productPrice);
    expect(await productLocators.productPrice.textContent()).toBe(
      expectedPriceFormat
    );
    expect(
      await productLocators.productAddRemoveButton.isEnabled()
    ).toBeTruthy();
  };

  verifyProductsDetails = async (products: Product[]) => {
    for (const product of products) {
      await this.verifyProductDetails(product);
    }
  };

  navigateToSideMenu = async () => {
    expect(await this.page.locator(this.burgerMenu).isEnabled()).toBeTruthy();
    await this.page.locator(this.burgerMenu).click();
  };

  navigateToShoppingCart = async () => {
    expect(await this.page.locator(this.shoppingCartLink).isEnabled()).toBeTruthy();
    await this.page.locator(this.shoppingCartLink).click();
  };

  addProductToCart = async (product: Product) => {
    const productLocators = await this.getProductInverntoryLocators(product.productNo);
    await productLocators.productAddRemoveButton.click();
    expect(await productLocators.productAddRemoveButton.textContent()).toBe(
      "Remove"
    );
  };
}

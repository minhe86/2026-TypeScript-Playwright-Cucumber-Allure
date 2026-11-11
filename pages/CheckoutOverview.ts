import UIPage from "./components/UIPage.ts";
import { expect } from "@playwright/test";
import type { Product } from "../data/utils.ts";

export default class CheckoutOverviewPage extends UIPage {
  subtotalLabel = "[data-test='subtotal-label']";
  cancelButton = "[data-test='cancel']";
  finishButton = "[data-test='finish']";

  getProductName = (productNo: number) => {
    return `a#item_${productNo}_title_link`;
  };

  getProductInverntoryLocators = async (productNo: number) => {
    const selectedInventoryLocator = this.page
      .locator("div.cart_item_label")
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
    await this.page.locator(this.cancelButton).waitFor();
    await this.page.locator(this.finishButton).waitFor();
  };

  verifyCheckoutProductDetails = async (product: Product) => {
    const productLocators = await this.getProductInverntoryLocators(
      product.productNo
    );

    expect(
      await productLocators.productAddRemoveButton.isVisible()
    ).toBeFalsy();

    expect(await productLocators.productName.textContent()).toBe(
      product.productName
    );
    const expectedPriceFormat = "$" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(product.productPrice);
    expect(await productLocators.productPrice.textContent()).toBe(
      expectedPriceFormat
    );

  };

  verifyCheckoutInfoDetails = async (selectedProducts: Product[]) => {
    const subtotal = selectedProducts.reduce((acc, product) => {
      return acc + product.productPrice;
    }, 0);

    const expectedPriceFormat =
      "Item total: $" +
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(subtotal);
    expect(await await this.page.locator(this.subtotalLabel).textContent()).toBe(
      expectedPriceFormat
    );
  };

  verifyPageDetails = async (selectedProducts: Product[]) => {
    expect(await this.page.title()).toContain("Swag Labs");
    expect(
      await this.page.locator(this.finishButton).isVisible()
    ).toBeTruthy();
    expect(
      await this.page.locator(this.cancelButton).isVisible()
    ).toBeTruthy();
    if (selectedProducts.length !== 0) {
      for (const product of selectedProducts) {
        await this.verifyCheckoutProductDetails(product);
      }
    };
    await this.verifyCheckoutInfoDetails(selectedProducts);
  };

  clickFinish = async () => {
    expect(await this.page.locator(this.finishButton).isEnabled()).toBeTruthy();
    await this.page.locator(this.finishButton).click();
  };

}

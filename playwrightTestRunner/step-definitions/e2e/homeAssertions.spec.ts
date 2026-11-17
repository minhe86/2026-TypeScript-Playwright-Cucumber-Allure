import { expect, test } from "@playwright/test";
import HomePage from "../../../pages/Home.ts";
import { Product } from "../../../data/utils.ts";

test("product checks wait for the displayed details to update", async ({ page }) => {
  await page.setContent(`
    <div class="inventory_item_description">
      <a id="item_1_title_link">Loading</a>
      <div class="inventory_item_desc">Loading</div>
      <div class="inventory_item_price">Loading</div>
      <button disabled>Add to cart</button>
    </div>
  `);
  await page.evaluate(() => {
    setTimeout(() => { document.querySelector("#item_1_title_link")!.textContent = "Backpack"; }, 300);
    setTimeout(() => { document.querySelector(".inventory_item_desc")!.textContent = "A useful bag"; }, 600);
    setTimeout(() => { document.querySelector(".inventory_item_price")!.textContent = "$29.99"; }, 900);
    setTimeout(() => { document.querySelector("button")!.disabled = false; }, 1200);
  });

  const homePage = new HomePage(page);
  await homePage.verifyProductName1("Backpack");
  await homePage.verifyProductDetails(new Product(1, "Backpack", 29.99, "A useful bag"));
});

test("menu navigation waits for the button to be enabled", async ({ page }) => {
  await page.setContent('<button id="react-burger-menu-btn" disabled>Open Menu</button>');
  await page.evaluate(() => {
    const menu = document.querySelector<HTMLButtonElement>("#react-burger-menu-btn")!;
    menu.addEventListener("click", () => { menu.dataset.clicked = "true"; });
    setTimeout(() => { menu.disabled = false; }, 300);
  });

  const homePage = new HomePage(page);
  await homePage.navigateToSideMenu();
  await expect(page.locator("#react-burger-menu-btn")).toHaveAttribute("data-clicked", "true");
});

test("cart navigation waits for the link to be enabled", async ({ page }) => {
  await page.setContent('<a class="shopping_cart_link" href="#cart" aria-disabled="true">Cart</a>');
  await page.evaluate(() => {
    const cart = document.querySelector<HTMLAnchorElement>(".shopping_cart_link")!;
    setTimeout(() => { cart.setAttribute("aria-disabled", "false"); }, 300);
  });

  const homePage = new HomePage(page);
  await homePage.navigateToShoppingCart();
  await expect(page).toHaveURL(/#cart$/);
});

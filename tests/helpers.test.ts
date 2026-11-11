import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DataTable } from "@cucumber/cucumber";
import { getProducts } from "../data/utils.ts";
import { getPageClass } from "../pages/pageRegistry.ts";
import { getRequiredTableValue } from "../step-definitions/e2e/support/dataTable.ts";

test("reads product data from CSV", async () => {
  const products = await getProducts("data/products.csv");
  assert.ok(products.length > 0);
  assert.equal(typeof products[0]?.productNo, "number");
});

test("resolves known page names and rejects unknown names", () => {
  assert.equal(getPageClass("Checkout Cart").name, "CheckoutCartPage");
  assert.throws(() => getPageClass("Unknown Page"), /Unknown page/);
});

test("reads required Cucumber data table values", () => {
  const table = new DataTable([["username", "standard_user"]]);
  assert.equal(getRequiredTableValue(table, "username"), "standard_user");
  assert.throws(() => getRequiredTableValue(table, "password"), /Missing data table value/);
});

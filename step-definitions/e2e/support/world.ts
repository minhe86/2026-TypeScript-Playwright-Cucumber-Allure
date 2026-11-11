import { setWorldConstructor, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";
import type { Product } from "../../../data/utils.ts";

export class ScenarioWorld extends World {
  browser: Browser | null = null;
  context!: BrowserContext;
  page!: Page;
  products: Product[] = [];
}

setWorldConstructor(ScenarioWorld);

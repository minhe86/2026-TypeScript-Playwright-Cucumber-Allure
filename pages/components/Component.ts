import type { Page } from "playwright";

class Component {
  constructor(public page: Page) {}

  static async create<T extends Component>(this: new (page: Page) => T, page: Page): Promise<T> {
    const component = new this(page);
    await component.waitForDisplayed();
    return component;
  }

  waitForDisplayed = async (): Promise<void> => {
    throw new Error(
      `${this.constructor.name}.waitForDisplayed is not implemented.`
    );
  };
}

export default Component;

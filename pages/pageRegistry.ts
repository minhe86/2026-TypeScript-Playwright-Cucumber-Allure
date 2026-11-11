import _ from "lodash";
import * as Pages from "./index.ts";
import Component from "./components/Component.ts";

function isPageKey(key: string): key is keyof typeof Pages {
  return Object.hasOwn(Pages, key);
}

export function getPageClass(pageName: string): typeof Component {
  const key = _.upperFirst(_.camelCase(pageName));
  if (!isPageKey(key)) {
    throw new Error(`Unknown page: ${pageName}`);
  }
  return Pages[key];
}

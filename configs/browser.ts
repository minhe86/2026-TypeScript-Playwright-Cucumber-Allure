import nconf from "nconf";
import _ from "lodash";
import { parseJsonConfig } from "./parse-json.ts";

nconf
  .env({
    transform: ({ key, value }: { key: string; value: string }) => {
      return { key, value: _.includes(["true", "false"], value) ? JSON.parse(value) : value };
    },
  })
  .argv()
  .file("default", {
    file: "./configs/config.default.json",
    format: {
      parse: (contents: string) => parseJsonConfig(contents, "configs/config.default.json"),
      stringify: JSON.stringify,
    },
  });

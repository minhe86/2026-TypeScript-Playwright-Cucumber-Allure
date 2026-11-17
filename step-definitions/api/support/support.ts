import _ from 'lodash';
import { Before } from "@cucumber/cucumber";
import nconf from 'nconf';
import { parseApiConfig } from "../../../api/utils/config.ts";

Before(async function () {
  nconf
      .env({
        transform: ({ key, value }: { key: string; value: string }) => {
          return { key, value: _.includes(['true', 'false'], value) ? JSON.parse(value) : value };
        },
      })
      .argv()
      .file('default', {
        file: './configs/config.api.json',
        format: { parse: parseApiConfig, stringify: JSON.stringify },
      });
});

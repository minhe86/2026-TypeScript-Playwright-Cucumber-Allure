import _ from 'lodash';
import { Before } from "@cucumber/cucumber";
import nconf from 'nconf';

Before(async function () {
  nconf
      .env({
        transform: ({ key, value }: { key: string; value: string }) => {
          return { key, value: _.includes(['true', 'false'], value) ? JSON.parse(value) : value };
        },
      })
      .argv()
      .file('default', './configs/config.api.json');
});

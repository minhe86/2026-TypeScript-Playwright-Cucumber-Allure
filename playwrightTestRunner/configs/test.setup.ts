import nconf from 'nconf';
import _ from 'lodash';

nconf
  .env({
    transform: ({ key, value }: { key: string; value: string }) => {
      return { key, value: _.includes(['true', 'false'], value) ? JSON.parse(value) : value };
    }
  })
  .argv()
  .file('default', './configs/config.default.json');  
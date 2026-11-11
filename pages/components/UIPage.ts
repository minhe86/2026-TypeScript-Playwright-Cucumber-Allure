import Component from "./Component.ts";
import nconf from 'nconf';

export default class UIPage extends Component {
  baseUrl = nconf.get('swagLabsBaseUrl');

  waitForDisplayed = async () => {};

  openUrl = async () => {
    await this.page.goto(this.baseUrl);
  };

}

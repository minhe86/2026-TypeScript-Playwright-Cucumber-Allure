import { Given } from "@cucumber/cucumber";
import AuthClient from "../../api/clients/authClient.ts";
import nconf from "nconf";
import type { ApiWorld } from "./support/world.ts";
import { requireApiCredentials, requireApiUrl } from "../../api/utils/config.ts";

Given<ApiWorld>("User gets an authorization token", async function () {
  const baseUrl = requireApiUrl(nconf.get("apiBaseUrl"), "apiBaseUrl");
  const credentials = requireApiCredentials(nconf.get("user:email"), nconf.get("user:password"), "in API configuration");

  const authClient = new AuthClient(baseUrl);
  this.token = await authClient.getToken(credentials);
});

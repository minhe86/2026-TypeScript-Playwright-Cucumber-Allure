import { Given } from "@cucumber/cucumber";
import AuthClient from "../../api/clients/authClient.ts";
import { expect } from "@playwright/test";
import nconf from "nconf";
import type { ApiWorld } from "./support/world.ts";

Given<ApiWorld>("User gets an authorization token", async function () {
  const baseUrl = nconf.get("apiBaseUrl");
  const emailValue = nconf.get("user:email");
  const passwordValue = nconf.get("user:password");

  const authClient = new AuthClient(baseUrl);
  const credentials = { email: emailValue, password: passwordValue };
  const token = await authClient.getToken(credentials);

  await this.attach(`Test Data: token = ${token}`, "text/plain");
  expect(token).not.toBeNull();
  this.token = token;
});

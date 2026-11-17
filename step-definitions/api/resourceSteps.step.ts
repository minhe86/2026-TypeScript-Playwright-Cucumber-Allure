import { Given, When, Then } from "@cucumber/cucumber";
import ResourceClient from "../../api/clients/resourceClient.ts";
import axios from "axios";
import ResourceModel from "../../api/models/resourceModel.ts";
import { validateStatusCode } from "../../api/utils/apiUtils.ts";
import { expect } from "@playwright/test";
import nconf from "nconf";
import type { ApiWorld } from "./support/world.ts";
import { requireApiUrl } from "../../api/utils/config.ts";

function getResourceClient(world: ApiWorld): ResourceClient {
  if (!world.resourceClient) {
    throw new Error("Resource client is not set in the World. Create it in this scenario first.");
  }
  return world.resourceClient;
}

// Backgroud info get - https://reqres.in/api/users/4
// {
//     "id": 4,
//     "email": "eve.holt@reqres.in",
//     "first_name": "Eve",
//     "last_name": "Holt",
//     "avatar": "https://reqres.in/img/faces/4-image.jpg"
// }

Given<ApiWorld>("User creates a resource client", function () {
  if (!this.token) {
    throw new Error(
      "Token is not set in the World. Ensure the authentication step runs first."
    );
  }
  const baseUrl = requireApiUrl(nconf.get("apiBaseUrl"), "apiBaseUrl");
  this.resourceClient = new ResourceClient(baseUrl, this.token);
});

// Have to assign existing user.id for creating user because https://reqres.in/ only getting existing users for demonstration.
When<ApiWorld>(
  "User creates a new user resource with name {string} and email {string}",
  async function (name: string, email: string) {
    const resourceData = { name, email };
    this.createdResourceResponse = await getResourceClient(this).createUsersResource(
      resourceData
    );
    this.resourceId = 4;
  }
);

Then<ApiWorld>("The user resource should be created successfully", function () {
  if (!this.createdResourceResponse) {
    throw new Error("User resource has not been created in this scenario.");
  }
  const createdResourceResponse = this.createdResourceResponse;
  const createdResource = createdResourceResponse.data;
  expect(createdResourceResponse.status).toEqual(201);

  const resourceModel = new ResourceModel(
    createdResource.name,
    createdResource.email,
    createdResource.id
  );
  this.attach(
    `Test Data: ${JSON.stringify(resourceModel, null, 2)}`,
    "application/json"
  );
});

When<ApiWorld>("User retrieves the user resource by ID", async function () {
  if (this.resourceId === undefined) {
    throw new Error("Resource ID is not set in the World. Create a user resource first.");
  }
  const retrievedResourceResponse = await getResourceClient(this).getUsersResource(
    this.resourceId
  );
  this.retrievedResourceResponse = retrievedResourceResponse;
  expect(retrievedResourceResponse.status).toEqual(200);
});

Then<ApiWorld>(
  "The user resource details should match name {string} and email {string}",
  function (name: string, email: string) {
    if (!this.retrievedResourceResponse) {
      throw new Error("User resource has not been retrieved in this scenario.");
    }
    const retrievedResource = this.retrievedResourceResponse.data;
    const resourceModel = new ResourceModel(
      retrievedResource.data.first_name,
      retrievedResource.data.email,
      retrievedResource.data.id
    );
    expect(resourceModel.name).toEqual(name);
    expect(resourceModel.email).toEqual(email);

    this.attach(
      `Test Data: ${JSON.stringify(resourceModel, null, 2)}`,
      "application/json"
    );
  }
);

// Note - No User Creation - unsuccessful is available here - https://reqres.in/, have to use Register for demnonstration here.
When<ApiWorld>(
  "User attempts to create a register resource with invalid data",
  async function () {
    const resourceClient = getResourceClient(this);
    this.errorResponse = undefined;
    try {
      await resourceClient.createRegisterResource({});
    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        throw error;
      }
      this.errorResponse = error.response;
    }
  }
);

Then<ApiWorld>("The register API should return a {int} error", function (statusCode: number) {
  if (!this.errorResponse) {
    throw new Error("The register request did not return an error response");
  }
  validateStatusCode(this.errorResponse, statusCode);
});

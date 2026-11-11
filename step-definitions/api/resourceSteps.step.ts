import { Given, When, Then } from "@cucumber/cucumber";
import ResourceClient from "../../api/clients/resourceClient.ts";
import type { CreatedResource, RetrievedResource } from "../../api/clients/resourceClient.ts";
import axios from "axios";
import type { AxiosResponse } from "axios";
import ResourceModel from "../../api/models/resourceModel.ts";
import { validateStatusCode } from "../../api/utils/apiUtils.ts";
import { expect } from "@playwright/test";
import nconf from "nconf";
import type { ApiWorld } from "./support/world.ts";

let resourceClient: ResourceClient;
let resourceId: number;
let createdResourceResponse: AxiosResponse<CreatedResource>;
let createdResource: CreatedResource;
let retrievedResourceResponse: AxiosResponse<RetrievedResource>;
let retrievedResource: RetrievedResource;

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
  const baseUrl = nconf.get("apiBaseUrl");
  resourceClient = new ResourceClient(baseUrl, this.token);
});

// Have to assign existing user.id for creating user because https://reqres.in/ only getting existing users for demonstration.
When<ApiWorld>(
  "User creates a new user resource with name {string} and email {string}",
  async function (name: string, email: string) {
    const resourceData = { name, email };
    createdResourceResponse = await resourceClient.createUsersResource(
      resourceData
    );
    createdResource = createdResourceResponse.data;
    resourceId = 4;
  }
);

Then<ApiWorld>("The user resource should be created successfully", function () {
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
  retrievedResourceResponse = await resourceClient.getUsersResource(
    resourceId
  );
  retrievedResource = retrievedResourceResponse.data;
  expect(retrievedResourceResponse.status).toEqual(200);
});

Then<ApiWorld>(
  "The user resource details should match name {string} and email {string}",
  function (name: string, email: string) {
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

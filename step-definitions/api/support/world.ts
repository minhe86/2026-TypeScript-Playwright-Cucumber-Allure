import type { IWorld } from "@cucumber/cucumber";
import type { AxiosResponse } from "axios";
import type ResourceClient from "../../../api/clients/resourceClient.ts";
import type { CreatedResource, RetrievedResource } from "../../../api/clients/resourceClient.ts";

export interface ApiWorld extends IWorld {
  token?: string;
  resourceClient?: ResourceClient;
  resourceId?: number;
  createdResourceResponse?: AxiosResponse<CreatedResource>;
  retrievedResourceResponse?: AxiosResponse<RetrievedResource>;
  errorResponse?: AxiosResponse;
}

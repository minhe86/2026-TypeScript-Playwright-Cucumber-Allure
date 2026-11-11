import type { IWorld } from "@cucumber/cucumber";
import type { AxiosResponse } from "axios";

export interface ApiWorld extends IWorld {
  token?: string;
  errorResponse?: AxiosResponse;
}

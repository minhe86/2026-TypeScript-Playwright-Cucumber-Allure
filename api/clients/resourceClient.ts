import axios from "axios";
import type { AxiosInstance } from "axios";

export interface CreatedResource {
  name: string;
  email: string;
  id: string;
}

export interface RetrievedResource {
  data: { first_name: string; email: string; id: number };
}

export default class ResourceClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, token: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createUsersResource(resourceData: { name: string; email: string }) {
    const response = await this.client.post<CreatedResource>("/api/users", resourceData);
    return response;
  }

  async getUsersResource(resourceId: number) {
    const response = await this.client.get<RetrievedResource>(`/api/users/${resourceId}`);
    return response;
  }
  async createRegisterResource(resourceData: Record<string, string>) {
    const response = await this.client.post("/api/register", resourceData);
    return response;
  }
}

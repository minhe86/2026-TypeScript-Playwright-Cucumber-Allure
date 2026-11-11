import axios from 'axios';
import type { AxiosInstance } from 'axios';

export default class AuthClient {
  private client: AxiosInstance;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl + '/',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getToken(credentials: { email: string; password: string }): Promise<string> {
    const response = await this.client.post<{ token: string }>('/api/login', credentials);
    return response.data.token;
  }
}
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
    const response = await this.client.post<unknown>('/api/login', credentials);
    const data = response.data;
    const token = typeof data === 'object' && data !== null && 'token' in data ? data.token : undefined;
    if (typeof token !== 'string' || !token) {
      throw new Error('API login response must contain a non-empty token');
    }
    return token;
  }
}
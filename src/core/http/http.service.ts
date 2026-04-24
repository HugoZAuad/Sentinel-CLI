import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { USER_AGENTS } from './user-agents.data';

@Injectable()
export class HttpService {
  private readonly axiosInstance: AxiosInstance;
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY = 1000;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });
  }

  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request(config: AxiosRequestConfig, retries = 0): Promise<AxiosResponse | null> {
    try {
      const headers = {
        ...config.headers,
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      };

      const response = await this.axiosInstance.request({ ...config, headers });

      if (response.status === 429 && retries < this.MAX_RETRIES) {
        const delay = this.INITIAL_DELAY * Math.pow(2, retries);
        console.warn(`[HTTP] Rate Limited (429). Tentando novamente em ${delay}ms...`);
        await this.sleep(delay);
        return this.request(config, retries + 1);
      }

      return response;
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        const delay = this.INITIAL_DELAY * Math.pow(2, retries);
        await this.sleep(delay);
        return this.request(config, retries + 1);
      }
      return null;
    }
  }

  async get(url: string, params?: any) {
    return this.request({ method: 'GET', url, params });
  }

  async post(url: string, data?: any) {
    return this.request({ method: 'POST', url, data });
  }
}
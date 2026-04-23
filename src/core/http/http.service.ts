import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface HttpOptions {
  followRedirect?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
}

@Injectable()
export class HttpService {
  async get(url: string, options?: HttpOptions) {
    const config: AxiosRequestConfig = {
      url,
      method: 'GET',
      timeout: options?.timeout ?? 10000,
      maxRedirects: options?.followRedirect === false ? 0 : 5,
      headers: {
        'User-Agent': 'SentinelCLI/1.0',
        ...(options?.headers || {}),
      },
      validateStatus: () => true,
    };

    return this.request(config);
  }

  async post(url: string, body: any, options?: HttpOptions) {
    const config: AxiosRequestConfig = {
      url,
      method: 'POST',
      data: body,
      timeout: options?.timeout ?? 10000,
      maxRedirects: options?.followRedirect === false ? 0 : 5,
      headers: {
        'User-Agent': 'SentinelCLI/1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(options?.headers || {}),
      },
      validateStatus: () => true,
    };

    return this.request(config);
  }

  private async request(config: AxiosRequestConfig) {
    for (let i = 0; i < 2; i++) {
      try {
        const res: AxiosResponse = await axios(config);

        return {
          status: res.status,
          headers: this.normalizeHeaders(res.headers),
          data:
            typeof res.data === 'string'
              ? res.data
              : JSON.stringify(res.data),
        };
      } catch {
        if (i === 1) return null;
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};

    Object.keys(headers || {}).forEach(k => {
      const v = headers[k];
      result[k.toLowerCase()] = Array.isArray(v)
        ? v.join('; ')
        : String(v);
    });

    return result;
  }
}
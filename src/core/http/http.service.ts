import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface HttpOptions {
  followRedirect?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
}

interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  data: string;
}

@Injectable()
export class HttpService {
  async get(url: string, options?: HttpOptions): Promise<HttpResponse | null> {
    try {
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

      const res: AxiosResponse = await axios(config);

      return {
        status: res.status,
        headers: this.normalizeHeaders(res.headers),
        data: this.parseData(res.data),
      };
    } catch {
      return null;
    }
  }

  async post(
    url: string,
    body: any,
    options?: HttpOptions,
  ): Promise<HttpResponse | null> {
    try {
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

      const res: AxiosResponse = await axios(config);

      return {
        status: res.status,
        headers: this.normalizeHeaders(res.headers),
        data: this.parseData(res.data),
      };
    } catch {
      return null;
    }
  }

  private parseData(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};

    Object.keys(headers || {}).forEach(key => {
      const value = headers[key];
      result[key.toLowerCase()] = Array.isArray(value)
        ? value.join('; ')
        : String(value);
    });

    return result;
  }
}
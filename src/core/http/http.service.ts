import { Injectable } from '@nestjs/common';

export interface HttpOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

@Injectable()
export class HttpService {
  private defaultTimeout = 5000;
  private defaultRetries = 2;

  async request(url: string, options: HttpOptions = {}): Promise<HttpResponse> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(id);

        const text = await response.text();

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: text,
        };
      } catch (error) {
        lastError = error;

        if (attempt === retries) break;
      }
    }

    throw lastError;
  }

  async get(url: string, options?: HttpOptions): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url: string, body: any, options?: HttpOptions): Promise<HttpResponse> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  }
}
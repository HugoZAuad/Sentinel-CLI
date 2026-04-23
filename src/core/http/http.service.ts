import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpService {
  async get(url: string): Promise<{
    status: number;
    headers: Record<string, string>;
    data: string;
  } | null> {
    try {
      const res = await fetch(url);

      const text = await res.text();

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        data: text,
      };
    } catch {
      return null;
    }
  }

  async post(url: string, data: Record<string, string>): Promise<{
    status: number;
    headers: Record<string, string>;
    data: string;
  } | null> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data).toString(),
      });

      const text = await res.text();

      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        data: text,
      };
    } catch {
      return null;
    }
  }
}
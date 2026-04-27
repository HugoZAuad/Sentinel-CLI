import { Injectable } from '@nestjs/common';

export interface EndpointDiscoveryItem {
  url: string;
  status: number;
  discovered: boolean;
}

export interface EndpointDiscoveryResult {
  analyzed: string[];
  discovered: string[];
  details: EndpointDiscoveryItem[];
}

@Injectable()
export class EndpointService {
  private wordlist = ['/', '/admin', '/login', '/dashboard', '/api', '/api/v1', '/robots.txt', '/sitemap.xml', '/health'];

  async discover(baseUrl: string): Promise<EndpointDiscoveryResult> {
    const analyzed: string[] = [];
    const discovered: string[] = [];
    const details: EndpointDiscoveryItem[] = [];

    const targetOrigin = new URL(baseUrl).origin;

    for (const path of this.wordlist) {
      const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
      const url = `${targetOrigin}${normalizedPath}`;
      analyzed.push(url);

      try {
        const res = await fetch(url);

        if (res.status < 400) {
          discovered.push(url);
        }

        details.push({
          url,
          status: res.status,
          discovered: res.status < 400,
        });
      } catch {}
    }

    return {
      analyzed: [...new Set(analyzed)],
      discovered: [...new Set(discovered)],
      details,
    };
  }
}
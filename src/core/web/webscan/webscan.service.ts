import { Injectable } from '@nestjs/common';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';

type WebScanSuccess = {
  url: string;
  status: number;
  time: string;
  headers: Record<string, string>;
  security: {
    hsts: boolean;
    xss: boolean;
    contentType: boolean;
    frame: boolean;
  };
  tech: string[];
  https: boolean;
  vulnerabilities: string[];
  links: string[];
  endpoints: string[];
};

type WebScanError = {
  url: string;
  error: string;
};

@Injectable()
export class WebscanService {
  constructor(
    private readonly crawler: CrawlerService,
    private readonly endpoint: EndpointService
  ) {}

  async scan(
    url: string,
    options?: {
      headers?: Record<string, string>;
      cookies?: string;
      token?: string;
    }
  ): Promise<WebScanSuccess | WebScanError> {
    try {
      const start = Date.now();

      const headers: Record<string, string> = {
        ...(options?.headers || {}),
      };

      if (options?.cookies) {
        headers['cookie'] = options.cookies;
      }

      if (options?.token) {
        headers['authorization'] = `Bearer ${options.token}`;
      }

      const response = await fetch(url, { headers });

      const end = Date.now();

      const responseHeaders = Object.fromEntries(response.headers.entries());

      const https = url.startsWith('https');

      const base = new URL(url).origin;

      const [links, endpoints] = await Promise.all([
        this.crawler.crawl(url, 1),
        this.endpoint.discover(base),
      ]);

      return {
        url,
        status: response.status,
        time: `${end - start}ms`,
        headers: responseHeaders,
        security: this.analyzeSecurity(responseHeaders),
        tech: this.detectTech(responseHeaders),
        https,
        vulnerabilities: this.analyzeVulnerabilities(responseHeaders, https),
        links,
        endpoints,
      };
    } catch (error: any) {
      return {
        url,
        error: error.message,
      };
    }
  }

  async scanMultiple(urls: string[]) {
    const results = await Promise.all(urls.map(url => this.scan(url)));
    return results;
  }

  async checkCVE(tech: string[]) {
    const db: Record<string, string[]> = {
      nginx: ['CVE-2021-23017'],
      apache: ['CVE-2021-41773'],
      express: ['CVE-2022-24999'],
      php: ['CVE-2019-11043'],
    };

    const vulns: string[] = [];

    tech.forEach(t => {
      const key = t.toLowerCase();
      if (db[key]) {
        vulns.push(...db[key]);
      }
    });

    return vulns;
  }

  analyzeSecurity(headers: Record<string, string>) {
    return {
      hsts: !!headers['strict-transport-security'],
      xss: !!headers['x-xss-protection'],
      contentType: !!headers['x-content-type-options'],
      frame: !!headers['x-frame-options'],
    };
  }

  detectTech(headers: Record<string, string>) {
    const server = headers['server'] || '';
    const powered = headers['x-powered-by'] || '';

    const tech: string[] = [];

    if (server.toLowerCase().includes('nginx')) tech.push('nginx');
    if (server.toLowerCase().includes('apache')) tech.push('apache');
    if (powered.toLowerCase().includes('express')) tech.push('express');
    if (powered.toLowerCase().includes('php')) tech.push('php');

    return tech.length ? tech : ['unknown'];
  }

  analyzeVulnerabilities(headers: Record<string, string>, https: boolean) {
    const issues: string[] = [];

    if (!https) issues.push('Sem HTTPS');
    if (!headers['strict-transport-security']) issues.push('Sem HSTS');
    if (!headers['x-frame-options']) issues.push('Sem clickjacking protection');
    if (!headers['x-content-type-options']) issues.push('Sem MIME protection');
    if (!headers['x-xss-protection']) issues.push('Sem XSS protection');
    if (headers['server']) issues.push('Server header exposto');
    if (headers['x-powered-by']) issues.push('X-Powered-By exposto');

    return issues;
  }
}
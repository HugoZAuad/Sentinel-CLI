import { Injectable } from '@nestjs/common';
import { HttpService } from '../../http/http.service';
import { AuthService } from '../auth/auth.service';
import { LoginForm } from '../auth/auth.types';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';

interface ScanSuccess {
  formFindings: any;
  url: string;
  status: number;
  time: string;
  headers: Record<string, string>;
  https: boolean;
  tech: string[];
  security: {
    hsts: boolean;
    xss: boolean;
    contentType: boolean;
    frame: boolean;
  };
  vulnerabilities: string[];
  links: string[];
  forms: unknown[];
  endpoints: unknown[];
  loginForm: LoginForm | null;
  error?: undefined;
}

interface ScanError {
  url: string;
  error: string;
}

type ScanResult = ScanSuccess | ScanError;

@Injectable()
export class WebscanService {
  constructor(
    private readonly http: HttpService,
    private readonly crawler: CrawlerService,
    private readonly endpoint: EndpointService,
    private readonly auth: AuthService,
  ) {}

  async scan(url: string): Promise<ScanResult> {
    const start = Date.now();

    try {
      const res = await this.http.get(url);

      const headers = res.headers;

      const security = {
        hsts: !!headers['strict-transport-security'],
        xss: !!headers['x-xss-protection'],
        contentType: !!headers['x-content-type-options'],
        frame: !!headers['x-frame-options'],
      };

      const tech = this.detectTech(headers, res.body);
      const vulnerabilities = this.detectVulnerabilities(headers);
      const crawlData = await this.crawler.crawl(url, 1);
      const endpoints = await this.endpoint.discover(url);
      const loginForm = await this.auth.detectLoginForm(url);

      return {
        formFindings: [],
        url,
        status: res.status,
        time: `${Date.now() - start}ms`,
        headers,
        https: url.startsWith('https'),
        tech,
        security,
        vulnerabilities,
        links: crawlData.links,
        forms: crawlData.forms,
        endpoints,
        loginForm,
      };
    } catch (error) {
      return {
        url,
        error: 'Falha ao acessar o alvo',
      };
    }
  }

  private detectTech(headers: Record<string, string>, body: string): string[] {
    const tech: string[] = [];

    if (headers['server']) tech.push(headers['server']);
    if (headers['x-powered-by']) tech.push(headers['x-powered-by']);

    if (body.includes('wp-content')) tech.push('WordPress');
    if (body.includes('react')) tech.push('React');
    if (body.includes('vue')) tech.push('Vue');
    if (body.includes('angular')) tech.push('Angular');

    return tech;
  }

  private detectVulnerabilities(headers: Record<string, string>): string[] {
    const vulns: string[] = [];

    if (!headers['x-frame-options']) vulns.push('Missing X-Frame-Options');
    if (!headers['x-content-type-options']) vulns.push('Missing X-Content-Type-Options');
    if (!headers['x-xss-protection']) vulns.push('Missing X-XSS-Protection');
    if (!headers['strict-transport-security']) vulns.push('Missing HSTS');

    return vulns;
  }

  async scanMultiple(urls: string[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    for (const url of urls) {
      const res = await this.scan(url);
      results.push(res);
    }

    return results;
  }

  async checkCVE(techs: string[]): Promise<string[]> {
    const fakeDB: Record<string, string[]> = {
      nginx: ['CVE-2021-23017'],
      apache: ['CVE-2021-41773'],
      express: ['CVE-2019-5424'],
    };

    const found: string[] = [];

    for (const tech of techs) {
      const key = tech.toLowerCase();
      if (fakeDB[key]) found.push(...fakeDB[key]);
    }

    return found;
  }
}
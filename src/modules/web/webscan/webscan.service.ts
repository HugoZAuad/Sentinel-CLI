import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { SecurityScoreService } from '../../score/security-score.service';
import { VulnEngine } from '../../vuln/vuln.engine';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';
import { FormScannerService } from '../formscanner/form-scanner.service';
import { WebScanResult } from './webscan.types';

@Injectable()
export class WebscanService {
  constructor(
    private readonly http: HttpService,
    private readonly crawler: CrawlerService,
    private readonly endpoint: EndpointService,
    private readonly form: FormScannerService,
    private readonly vuln: VulnEngine,
    private readonly score: SecurityScoreService,
  ) {}

  async scan(url: string): Promise<WebScanResult | { error: string }> {
    const start = Date.now();

    try {
      const response = await this.http.get(url);

      if (!response || !response.data) {
        return { error: 'Falha ao acessar alvo' };
      }

      const headers = this.normalizeHeaders(response.headers);
      const body = response.data;

      const security = this.analyzeSecurity(headers);
      const tech = this.detectTech(headers, body);

      const links = await this.crawler.crawl(url, 1);
      const endpoints = await this.endpoint.discover(url);
      const forms = await this.form.scan(url);

      const targets = this.prioritize([
        ...new Set([url, ...links, ...endpoints]),
      ]);

      const vulnerabilities = await this.runVuln(targets);

      const score = this.score.calculate(vulnerabilities);

      return {
        url,
        status: response.status,
        time: `${Date.now() - start}ms`,
        https: url.startsWith('https'),
        headers,
        tech,
        security,
        links,
        endpoints,
        forms,
        vulnerabilities,
        score,
        meta: {
          scannedUrls: targets.length,
          duration: Date.now() - start,
        },
      };
    } catch {
      return { error: 'Erro no scan' };
    }
  }

  private prioritize(urls: string[]): string[] {
    return urls
      .filter(u => u.includes('?'))
      .concat(urls)
      .slice(0, 20);
  }

  private async runVuln(targets: string[]): Promise<any[]> {
    const results: any[] = [];

    for (const target of targets) {
      const params = this.extractParams(target);
      if (params.length === 0) continue;

      const vulns = await this.vuln.run(target, params);
      results.push(...vulns);
    }

    return results;
  }

  private extractParams(url: string): string[] {
    const query = url.split('?')[1];
    if (!query) return [];
    return query.split('&').map(p => p.split('=')[0]);
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(headers || {}).forEach(k => {
      result[k.toLowerCase()] = headers[k];
    });
    return result;
  }

  private analyzeSecurity(headers: Record<string, string>) {
    return {
      hsts: !!headers['strict-transport-security'],
      xss: !!headers['x-xss-protection'],
      contentType: !!headers['x-content-type-options'],
      frame: !!headers['x-frame-options'],
    };
  }

  private detectTech(headers: Record<string, string>, body: string): string[] {
    const tech: string[] = [];

    if (headers['server']) tech.push(headers['server']);
    if (headers['x-powered-by']) tech.push(headers['x-powered-by']);

    if (body.includes('wp-content')) tech.push('WordPress');
    if (body.includes('laravel')) tech.push('Laravel');

    return tech;
  }
}
import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { promisePool } from '../../../shared/utils/concurrency.util';
import { SecurityScoreService } from '../../score/security-score.service';
import { VulnEngine } from '../../vuln/vuln.engine';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';
import { FormScannerService } from '../formscanner/form-scanner.service';
import { WebScanResult } from './webscan.types';

@Injectable()
export class WebscanService {
  private readonly CONCURRENCY_LIMIT = 3;

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
      
      const allTargets = [...new Set([url, ...links, ...endpoints])].slice(0, 50);

      const vulnTasks = allTargets.map((target) => async () => {
        const params = this.extractParams(target);
        return params.length > 0 ? await this.vuln.run(target, params) : [];
      });

      const vulnResults = await promisePool(vulnTasks, this.CONCURRENCY_LIMIT);
      const vulnerabilities = vulnResults.flat();

      const formTasks = [url, ...links].map((target) => async () => {
        return await this.form.scan(target);
      });

      const formResults = await promisePool(formTasks, this.CONCURRENCY_LIMIT);
      const forms = formResults.flat();

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
          scannedUrls: allTargets.length,
          duration: Date.now() - start,
        },
      };
    } catch {
      return { error: 'Erro inesperado no processo de scan' };
    }
  }

  private extractParams(url: string): string[] {
    try {
      const query = url.split('?')[1];
      if (!query) return [];
      return query.split('&').map(p => p.split('=')[0]);
    } catch {
      return [];
    }
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(headers || {}).forEach(k => {
      result[k.toLowerCase()] = String(headers[k]);
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
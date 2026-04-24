import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '../../../../core/http/http.service';
import { ReportService } from '../../../../infrastructure/report/report.service';
import { SecurityScoreService } from '../../../blue/score/security-score.service';
import { FingerprintService } from '../../../blue/web/fingerprint/fingerprint.service';
import { CrawlerService } from '../crawler/crawler.service';
import { VulnFinding } from '../vuln/vuln-check.interface';
import { VulnEngine } from '../vuln/vuln.engine';
import { WebScanResult } from './webscan.types';

@Injectable()
export class WebscanService {
  private readonly logger = new Logger(WebscanService.name);
  private readonly MAX_URLS = 50;

  constructor(
    private readonly crawler: CrawlerService,
    private readonly fingerprint: FingerprintService,
    private readonly vulnEngine: VulnEngine,
    private readonly scoreService: SecurityScoreService,
    private readonly report: ReportService,
    private readonly http: HttpService,
  ) {}

  async scan(url: string): Promise<WebScanResult> {
    const startTime = Date.now();

    try {
      const initialRes = await this.http.get(url);
      if (!initialRes || !initialRes.data) throw new Error('Alvo inacessível.');

      const headers = this.normalizeHeaders(initialRes.headers);
      const profiles = this.fingerprint.analyze(headers, String(initialRes.data));
      
      const links = await this.crawler.crawl(url, 1);
      const targetUrls: string[] = [...new Set([url, ...links])].slice(0, this.MAX_URLS);

      const vulnerabilities: VulnFinding[] = [];

      for (const target of targetUrls) {
        const findings = await this.vulnEngine.run(target, [], 'GET'); 
        vulnerabilities.push(...findings);
      }

      const scoreData = this.scoreService.calculate(vulnerabilities);
      const durationNum = (Date.now() - startTime) / 1000;

      return {
        url,
        status: 1, 
        time: `${durationNum.toFixed(2)}s`,
        links: targetUrls,
        endpoints: targetUrls,
        forms: [],
        tech: profiles.map(p => p.name),
        vulnerabilities,
        score: { value: Number(scoreData.value) },
        https: url.startsWith('https'),
        headers: headers,
        
        security: {
          hsts: !!headers['strict-transport-security'],
          xss: !!headers['x-xss-protection'],
          contentType: !!headers['x-content-type-options'],
          frame: !!headers['x-frame-options']
        },

        meta: {
          scannedUrls: targetUrls.length,
          duration: durationNum
        }
      };

    } catch (error: any) {
      this.logger.error(`Scan falhou: ${error.message}`);
      throw error;
    }
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    if (!headers) return normalized;
    for (const key in headers) {
      normalized[key.toLowerCase()] = String(headers[key]);
    }
    return normalized;
  }
}
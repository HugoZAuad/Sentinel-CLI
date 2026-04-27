import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../../../core/browser/browser.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';

@Injectable()
export class WebscanService {
  constructor(
    private readonly browser: BrowserService,
    private readonly crawler: CrawlerService,
    private readonly endpointService: EndpointService,
    private readonly logger: LoggerService,
  ) {}

  async execute(targetUrl: string): Promise<{ findings: any[]; endpoints: string[] }> {
    const allFindings: any[] = [];
    const discoveredEndpoints = new Set<string>();
    const page = await this.browser.newPage();

    try {
      this.logger.startTask(`Iniciando Web Scan: ${targetUrl}`);
      
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });

      const crawledLinks = await this.crawler.crawl(targetUrl, 1);
      const endpointCandidates = await this.endpointService.discover(new URL(targetUrl).origin);

      crawledLinks.forEach((link) => discoveredEndpoints.add(link));
      endpointCandidates.forEach((endpoint) => discoveredEndpoints.add(endpoint));

      const xssFindings = await page.evaluate(() => {
        const findings: any[] = [];
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.innerHTML.includes('eval(') || script.innerHTML.includes('innerHTML')) {
            findings.push({
              type: 'DOM XSS Risk',
              evidence: script.innerHTML.substring(0, 100)
            });
          }
        });
        return findings;
      });

      allFindings.push(...xssFindings);

      this.logger.stopTask(`Scan finalizado. ${allFindings.length} vulnerabilidades encontradas.`);
      return {
        findings: allFindings,
        endpoints: [...discoveredEndpoints],
      };
    } catch (error) {
      this.logger.error('Erro no WebscanService', error);
      return {
        findings: [],
        endpoints: [],
      };
    } finally {
      await page.close();
    }
  }
}
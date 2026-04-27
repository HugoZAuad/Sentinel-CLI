import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../../../core/browser/browser.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';
import { WebScanResult } from './webscan.types';

@Injectable()
export class WebscanService {
  constructor(
    private readonly browser: BrowserService,
    private readonly crawler: CrawlerService,
    private readonly endpointService: EndpointService,
    private readonly logger: LoggerService,
  ) {}

  async execute(targetUrl: string): Promise<WebScanResult> {
    const allFindings: any[] = [];
    const discoveredEndpoints = new Set<string>();
    const analyzedEndpoints = new Set<string>();
    const endpointMap = new Map<
      string,
      {
        endpoint: string;
        status?: number;
        discovered: boolean;
        analyzed: boolean;
        checks: string[];
        findings: string[];
      }
    >();
    const page = await this.browser.newPage();
    const scanStart = Date.now();

    try {
      this.logger.startTask(`Iniciando Web Scan: ${targetUrl}`);
      
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });

      const crawledLinks = await this.crawler.crawl(targetUrl, 1);
      const endpointCandidates = await this.endpointService.discover(new URL(targetUrl).origin);

      const upsertEndpoint = (
        endpoint: string,
        patch: {
          status?: number;
          discovered?: boolean;
          analyzed?: boolean;
          check?: string;
        },
      ) => {
        const existing = endpointMap.get(endpoint) ?? {
          endpoint,
          status: undefined,
          discovered: false,
          analyzed: false,
          checks: [],
          findings: [],
        };

        if (patch.status !== undefined) {
          existing.status = patch.status;
        }

        if (patch.discovered !== undefined) {
          existing.discovered = existing.discovered || patch.discovered;
        }

        if (patch.analyzed !== undefined) {
          existing.analyzed = existing.analyzed || patch.analyzed;
        }

        if (patch.check && !existing.checks.includes(patch.check)) {
          existing.checks.push(patch.check);
        }

        endpointMap.set(endpoint, existing);
      };

      upsertEndpoint(targetUrl, {
        analyzed: true,
        discovered: true,
        check: 'Análise DOM para sinks XSS',
      });

      crawledLinks.discovered.forEach((link) => discoveredEndpoints.add(link));
      crawledLinks.analyzed.forEach((link) => analyzedEndpoints.add(link));

      crawledLinks.discovered.forEach((link) => {
        upsertEndpoint(link, {
          discovered: true,
          check: 'Descoberta por crawler',
        });
      });

      crawledLinks.analyzed.forEach((link) => {
        upsertEndpoint(link, {
          analyzed: true,
          check: 'Análise de rota descoberta',
        });
      });

      endpointCandidates.discovered.forEach((endpoint) => discoveredEndpoints.add(endpoint));
      endpointCandidates.analyzed.forEach((endpoint) => analyzedEndpoints.add(endpoint));

      endpointCandidates.details.forEach((item) => {
        upsertEndpoint(item.url, {
          status: item.status,
          discovered: item.discovered,
          analyzed: true,
          check: 'Probe HTTP por wordlist',
        });
      });

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

      if (xssFindings.length > 0) {
        const rootEndpoint = endpointMap.get(targetUrl);
        if (rootEndpoint) {
          const findingTypes = [...new Set(xssFindings.map((finding) => finding.type ?? 'Achado Web'))];
          rootEndpoint.findings.push(...findingTypes.filter((type) => !rootEndpoint.findings.includes(type)));
          endpointMap.set(targetUrl, rootEndpoint);
        }
      }

      const endpointDetails = [...endpointMap.values()]
        .filter((item) => item.discovered || item.analyzed)
        .sort((a, b) => a.endpoint.localeCompare(b.endpoint));

      const duration = Date.now() - scanStart;
      this.logger.stopTask(`Scan finalizado. ${allFindings.length} vulnerabilidades encontradas.`);
      return {
        url: targetUrl,
        status: 200,
        time: `${(duration / 1000).toFixed(1)}s`,
        https: targetUrl.startsWith('https://'),
        headers: {},
        tech: [],
        security: {
          hsts: false,
          xss: xssFindings.length > 0,
          contentType: false,
          frame: false,
        },
        links: [...discoveredEndpoints],
        endpoints: [...discoveredEndpoints],
        analyzedEndpoints: [...analyzedEndpoints],
        discoveredEndpoints: [...discoveredEndpoints],
        endpointDetails,
        forms: [],
        findings: allFindings,
        vulnerabilities: allFindings,
        meta: {
          scannedUrls: analyzedEndpoints.size,
          duration,
          endpointsAnalyzed: analyzedEndpoints.size,
          endpointsDiscovered: discoveredEndpoints.size,
        },
      };
    } catch (error) {
      this.logger.error('Erro no WebscanService', error);
      return {
        url: targetUrl,
        status: 0,
        time: '0s',
        https: targetUrl.startsWith('https://'),
        headers: {},
        tech: [],
        security: {
          hsts: false,
          xss: false,
          contentType: false,
          frame: false,
        },
        links: [],
        endpoints: [],
        analyzedEndpoints: [],
        discoveredEndpoints: [],
        endpointDetails: [],
        forms: [],
        findings: [],
        vulnerabilities: [],
        meta: {
          scannedUrls: 0,
          duration: 0,
          endpointsAnalyzed: 0,
          endpointsDiscovered: 0,
        },
      };
    } finally {
      await page.close();
    }
  }
}
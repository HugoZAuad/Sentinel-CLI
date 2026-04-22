import { Injectable } from '@nestjs/common';
import { CrawlerService } from '../crawler/crawler.service';
import { EndpointService } from '../endpoint/endpoint.service';
import { FormScannerService } from '../formscanner/form-scanner.service';


@Injectable()
export class WebscanService {
  constructor(
    private readonly crawler: CrawlerService,
    private readonly endpoint: EndpointService,
    private readonly formScanner: FormScannerService
  ) {}

  async scan(url: string) {
    try {
      const start = Date.now();

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const end = Date.now();

      const headers = Object.fromEntries(res.headers.entries());

      const https = url.startsWith('https');

      const base = new URL(url).origin;

      const [crawlData, endpoints] = await Promise.all([
        this.crawler.crawl(url, 1),
        this.endpoint.discover(base),
      ]);

      const formFindings = await this.formScanner.scanForms(crawlData.forms);

      return {
        url,
        status: res.status,
        time: `${end - start}ms`,
        headers,
        https,
        links: crawlData.links,
        endpoints,
        forms: crawlData.forms,
        formFindings,
      };
    } catch (error: any) {
      return {
        url,
        error: error.message,
      };
    }
  }

  async scanMultiple(urls: string[]) {
    return Promise.all(urls.map(url => this.scan(url)));
  }
}
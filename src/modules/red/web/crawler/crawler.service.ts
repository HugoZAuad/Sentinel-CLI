import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { HttpService } from '../../../../core/http/http.service';
import { FingerprintService } from '../../../blue/web/fingerprint/fingerprint.service';
import { InteractionEngine } from './interaction/interaction.engine';

@Injectable()
export class CrawlerService {
  constructor(
    private readonly http: HttpService,
    private readonly interaction: InteractionEngine,
    private readonly fingerprint: FingerprintService,
  ) {}

  async crawl(url: string, p0: number): Promise<string[]> {
    try {
      const res = await this.http.get(url);
      if (!res?.data) return [];

      const headers = this.normalizeHeaders(res.headers);
      const body = String(res.data);

      const profiles = this.fingerprint.analyze(headers, body);
      const requiresJs = profiles.some((p) => p.needsPuppeteer);

      const staticLinks = this.extractStaticLinks(body, url);

      if (requiresJs) {
        const dynamicLinks = await this.deepCrawl(url);
        return [...new Set([...staticLinks, ...dynamicLinks])];
      }

      return staticLinks;
    } catch {
      return [];
    }
  }

  private async deepCrawl(url: string): Promise<string[]> {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const extraLinks = await this.interaction.simulate(page);
      const jsLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .map((a) => a.href)
          .filter((href) => href.startsWith('http')),
      );
      return [...extraLinks, ...jsLinks];
    } catch {
      return [];
    } finally {
      await browser.close();
    }
  }

  private extractStaticLinks(html: string, baseUrl: string): string[] {
    const regex = /href="([^"|#]+)"/g;
    const links: string[] = [];
    let match;
    const origin = new URL(baseUrl).origin;

    while ((match = regex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('/')) {
        links.push(`${origin}${href}`);
      } else if (href.startsWith('http')) {
        links.push(href);
      }
    }
    return [...new Set(links)];
  }

  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const key in headers) {
      if (headers[key]) {
        normalized[key.toLowerCase()] = String(headers[key]);
      }
    }
    return normalized;
  }
}
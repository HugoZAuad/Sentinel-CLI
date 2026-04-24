import { Injectable } from '@nestjs/common';
import { InteractionService } from '../../../../core/browser/interaction.service';
import { HttpService } from '../../../../core/http/http.service';
import { FingerprintService } from '../../../blue/web/fingerprint/fingerprint.service';

@Injectable()
export class CrawlerService {
  constructor(
    private readonly http: HttpService,
    private readonly interaction: InteractionService,
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
    try {
      return await this.interaction.explore(url);
    } catch {
      return [];
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
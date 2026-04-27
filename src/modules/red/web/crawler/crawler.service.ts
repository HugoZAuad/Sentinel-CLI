import { Injectable } from '@nestjs/common';
import { InteractionService } from '../../../../core/browser/interaction.service';
import { HttpService } from '../../../../core/http/http.service';
import { FingerprintService } from '../../../blue/web/fingerprint/fingerprint.service';

export interface CrawlResult {
  analyzed: string[];
  discovered: string[];
}

@Injectable()
export class CrawlerService {
  constructor(
    private readonly http: HttpService,
    private readonly interaction: InteractionService,
    private readonly fingerprint: FingerprintService,
  ) {}

  async crawl(url: string, depth: number): Promise<CrawlResult> {
    const analyzed = new Set<string>([url]);
    const discovered = new Set<string>();

    try {
      const res = await this.http.get(url);
      if (!res?.data) {
        return {
          analyzed: [...analyzed],
          discovered: [...discovered],
        };
      }

      const body = String(res.data);

      const techs = await this.fingerprint.identify(url);
      const requiresJs = techs.some((t) => t.isRisk || t.name === 'React' || t.name === 'Angular');

      const staticLinks = this.extractStaticLinks(body, url);
      staticLinks.forEach((link) => discovered.add(link));

      if (requiresJs) {
        const dynamicLinks = await this.deepCrawl(url);
        dynamicLinks.forEach((link) => {
          discovered.add(link);
          analyzed.add(link);
        });
      }

      if (depth > 1) {
        for (const link of [...discovered].slice(0, 10)) {
          analyzed.add(link);
        }
      }

      return {
        analyzed: [...analyzed],
        discovered: [...discovered],
      };
    } catch {
      return {
        analyzed: [...analyzed],
        discovered: [...discovered],
      };
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
      const href = match[1];
      if (href.startsWith('/')) {
        links.push(`${origin}${href}`);
      } else if (href.startsWith('http')) {
        links.push(href);
      }
    }
    return [...new Set(links)];
  }
}
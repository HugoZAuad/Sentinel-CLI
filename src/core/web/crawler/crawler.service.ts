import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { HttpService } from '../../http/http.service';

interface CrawlResult {
  links: string[];
  forms: any[];
  depth: number;
}

@Injectable()
export class CrawlerService {
  private visited = new Set<string>();
  private concurrency = 5;
  private delay = 200;
  private baseHost = '';

  constructor(private readonly http: HttpService) {}

  async crawl(startUrl: string, maxDepth = 1) {
    this.visited.clear();
    this.baseHost = new URL(startUrl).host;

    let queue: { url: string; depth: number }[] = [
      { url: this.normalize(startUrl), depth: 0 },
    ];

    const forms: any[] = [];

    while (queue.length > 0) {
      const batch = queue.splice(0, this.concurrency);

      const results = await Promise.all(
        batch.map(item => this.processUrl(item.url, item.depth))
      );

      for (const res of results) {
        if (!res) continue;

        if (res.forms.length) {
          forms.push(...res.forms);
        }

        if (res.depth >= maxDepth) continue;

        for (const link of res.links) {
          const normalized = this.normalize(link);

          if (!this.visited.has(normalized)) {
            this.visited.add(normalized);
            queue.push({ url: normalized, depth: res.depth + 1 });
          }
        }
      }

      await this.sleep(this.delay);
    }

    return {
      links: Array.from(this.visited),
      forms,
    };
  }

  private async processUrl(url: string, depth: number): Promise<CrawlResult | null> {
    if (!this.isSameDomain(url)) return null;

    try {
      const res = await this.http.get(url);

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('text/html')) return null;

      const html = res.body.slice(0, 200000);

      const $ = cheerio.load(html);

      const links: string[] = [];

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const absolute = new URL(href, url).href;

          if (this.isValidLink(absolute)) {
            links.push(absolute);
          }
        } catch {}
      });

      const forms: any[] = [];

      $('form').each((_, form) => {
        const action = $(form).attr('action') || url;
        const method = ($(form).attr('method') || 'GET').toUpperCase();

        const inputs: string[] = [];

        $(form)
          .find('input, textarea')
          .each((_, input) => {
            const name = $(input).attr('name');
            if (name) inputs.push(name);
          });

        forms.push({
          action: new URL(action, url).href,
          method,
          inputs,
        });
      });

      return { links, forms, depth };
    } catch {
      return null;
    }
  }

  private normalize(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  private isSameDomain(url: string): boolean {
    try {
      return new URL(url).host === this.baseHost;
    } catch {
      return false;
    }
  }

  private isValidLink(url: string) {
    return !(
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.gif') ||
      url.endsWith('.css') ||
      url.endsWith('.js') ||
      url.includes('#')
    );
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
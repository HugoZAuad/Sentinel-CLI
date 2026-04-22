import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class CrawlerService {
  private visited = new Set<string>();
  private concurrency = 5;
  private timeout = 5000;

  async crawl(startUrl: string, depth = 1): Promise<string[]> {
    this.visited.clear();

    let queue: { url: string; depth: number }[] = [
      { url: startUrl, depth: 0 },
    ];

    while (queue.length > 0) {
      const batch = queue.splice(0, this.concurrency);

      const results = await Promise.all(
        batch.map(item => this.processUrl(item.url, item.depth))
      );

      results.forEach(res => {
        if (!res) return;

        const { links, depth: currentDepth } = res;

        if (currentDepth >= depth) return;

        links.forEach(link => {
          if (!this.visited.has(link)) {
            this.visited.add(link);
            queue.push({ url: link, depth: currentDepth + 1 });
          }
        });
      });
    }

    return Array.from(this.visited);
  }

  private async processUrl(url: string, depth: number) {
    try {
      const res = await this.fetchWithTimeout(url);

      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('text/html')) return null;

      const text = await res.text();
      const html = text.slice(0, 200000);

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

      return { links, depth };
    } catch {
      return null;
    }
  }

  private async fetchWithTimeout(url: string) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
    } finally {
      clearTimeout(id);
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
}
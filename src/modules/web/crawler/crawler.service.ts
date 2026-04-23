import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';

@Injectable()
export class CrawlerService {
  constructor(private readonly http: HttpService) {}

  async crawl(url: string, depth = 1): Promise<string[]> {
    const visited = new Set<string>();
    const results = new Set<string>();

    await this.walk(url, depth, visited, results);

    return Array.from(results);
  }

  private async walk(
    url: string,
    depth: number,
    visited: Set<string>,
    results: Set<string>,
  ) {
    if (depth === 0) return;
    if (visited.has(url)) return;

    visited.add(url);

    const res = await this.http.get(url);
    if (!res || !res.data) return;

    const links = this.extractLinks(res.data, url);

    for (const link of links) {
      if (!this.isValid(link)) continue;

      results.add(link);

      await this.walk(link, depth - 1, visited, results);
    }
  }

  private extractLinks(html: string, base: string): string[] {
    const links: string[] = [];

    const regex = /href=["'](.*?)["']/gi;
    let match;

    while ((match = regex.exec(html))) {
      try {
        const raw = match[1].trim();

        if (!raw) continue;
        if (raw.startsWith('#')) continue;
        if (raw.startsWith('javascript:')) continue;

        const url = new URL(raw, base).toString();

        links.push(url);
      } catch {}
    }

    return links;
  }

  private isValid(url: string): boolean {
    return !url.match(
      /\.(jpg|jpeg|png|gif|css|svg|js|ico|woff|ttf|map)$/i,
    );
  }
}
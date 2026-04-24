import { Injectable } from "@nestjs/common";
import type { HttpService } from "src/core/http/http.service";

@Injectable()
export class CrawlerService {
  constructor(private readonly http: HttpService) {}

  async crawl(url: string, depth = 1): Promise<string[]> {
    const targetUrl = new URL(url);
    const visited = new Set<string>();
    const results = new Set<string>();

    await this.walk(url, depth, visited, results, targetUrl.hostname);

    return Array.from(results);
  }

  private async walk(url: string, depth: number, visited: Set<string>, results: Set<string>, allowedHost: string) {
    if (depth === 0 || visited.has(url)) return;

    try {
      const currentUrl = new URL(url);
      if (currentUrl.hostname !== allowedHost) return;
    } catch { return; }

    visited.add(url);
    const res = await this.http.get(url);
    if (!res || !res.data) return;

    const links = this.extractLinks(res.data, url);

    for (const link of links) {
      if (this.isValid(link)) {
        results.add(link);
        await this.walk(link, depth - 1, visited, results, allowedHost);
      }
    }
  }

  private extractLinks(html: string, base: string): string[] {
    const links: string[] = [];
    const regex = /href=["'](.*?)["']/gi;
    let match;

    while ((match = regex.exec(html))) {
      try {
        const raw = match[1].trim();
        if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) continue;
        links.push(new URL(raw, base).toString());
      } catch {}
    }
    return links;
  }

  private isValid(url: string): boolean {
    return !url.match(/\.(jpg|jpeg|png|gif|css|svg|js|ico|woff|ttf|map)$/i);
  }
}
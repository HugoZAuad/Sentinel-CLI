import { Injectable } from '@nestjs/common';

@Injectable()
export class CrawlerService {
  async crawl(url: string, depth: number): Promise<string[]> {
    const links: string[] = [];

    try {
      const res = await fetch(url);
      const html = await res.text();

      const matches = html.match(/href=["'](.*?)["']/g) || [];

      matches.forEach(m => {
        const link = m.replace(/href=["']/, '').replace(/["']$/, '');

        if (!link.startsWith('http')) return;

        if (!link.match(/\.(png|jpg|css|js|svg)$/)) {
          links.push(link);
        }
      });
    } catch {}

    return [...new Set(links)];
  }
}
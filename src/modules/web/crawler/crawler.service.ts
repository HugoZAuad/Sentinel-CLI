import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { HttpService } from '../../../core/http/http.service';
import { InteractionEngine } from './interaction/interaction.engine';

@Injectable()
export class CrawlerService {
  constructor(
    private readonly http: HttpService,
    private readonly interaction: InteractionEngine
  ) {}

  async crawl(baseUrl: string, depth: number = 1): Promise<string[]> {
    const staticLinks = await this.fastCrawl(baseUrl);
    const dynamicLinks = await this.deepCrawl(baseUrl);
    return [...new Set([...staticLinks, ...dynamicLinks])];
  }

  private async deepCrawl(url: string): Promise<string[]> {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const extraLinks = await this.interaction.simulate(page);
      
      const jsLinks = await page.evaluate(() => 
        Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href.startsWith('http'))
      );

      return [...extraLinks, ...jsLinks];
    } catch {
      return [];
    } finally {
      await browser.close();
    }
  }

  private async fastCrawl(url: string): Promise<string[]> {
    try {
      const res = await this.http.get(url);
      if (!res?.data) return [];
      
      const html = String(res.data);
      const regex = /href="([^"|#]+)"/g;
      const links: string[] = [];
      let match;

      while ((match = regex.exec(html)) !== null) {
        if (match[1].startsWith('http')) {
          links.push(match[1]);
        } else if (match[1].startsWith('/')) {
          const origin = new URL(url).origin;
          links.push(`${origin}${match[1]}`);
        }
      }
      return links;
    } catch {
      return [];
    }
  }
}
import { Injectable } from '@nestjs/common';
import { BrowserService } from './browser.service';

@Injectable()
export class InteractionService {
  constructor(private readonly browser: BrowserService) {}

  async explore(url: string): Promise<string[]> {
    const browser = await this.browser.getBrowser();
    const page = await browser.newPage();

    const discovered: string[] = [];

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });

    const links = await page.$$eval('a', as =>
      as.map(a => (a as HTMLAnchorElement).href)
    );

    discovered.push(...links);

    const buttons = await page.$$('button');

    for (const btn of buttons.slice(0, 5)) {
      try {
        await btn.click();
        await new Promise(r => setTimeout(r, 1000));
      } catch {}
    }

    await page.close();

    return [...new Set(discovered)];
  }
}
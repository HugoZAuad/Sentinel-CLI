import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';

@Injectable()
export class InteractionEngine {
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async simulate(page: Page): Promise<string[]> {
    const discoveredLinks: string[] = [];
    await this.fillInputs(page);
    
    const linksFromClicks = await this.interactWithElements(page);
    discoveredLinks.push(...linksFromClicks);

    return [...new Set(discoveredLinks)];
  }

  private async fillInputs(page: Page) {
    const inputs = await page.$$('input:not([type="submit"]), textarea');
    for (const input of inputs.slice(0, 5)) {
      try {
        await input.type('sentinel_test');
      } catch {}
    }
  }

  private async interactWithElements(page: Page): Promise<string[]> {
    const links: string[] = [];
    const buttons = await page.$$('button, input[type="submit"], [role="button"]');

    for (const btn of buttons.slice(0, 5)) {
      try {
        await btn.click();
        await this.delay(1000);
        links.push(page.url());
      } catch {}
    }
    return links;
  }
}
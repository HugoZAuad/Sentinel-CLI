import { Page } from 'puppeteer';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export class InteractionEngine {
  async simulate(page: Page) {
    await this.fill(page);
    await this.click(page);
    await this.navigate(page);
  }

  private async fill(page: Page) {
    const inputs = await page.$$('input, textarea');

    for (const input of inputs) {
      try {
        await input.type('test');
      } catch {}
    }
  }

  private async click(page: Page) {
    const elements = await page.$$('button, input[type=submit], a');

    for (const el of elements.slice(0, 5)) {
      try {
        await el.click();
        await sleep(500);
      } catch {}
    }
  }

  private async navigate(page: Page) {
    const links = await page.$$('a');

    for (const link of links.slice(0, 3)) {
      try {
        await link.click();
        await sleep(1000);
      } catch {}
    }
  }
} 
import { Injectable } from '@nestjs/common';
import { PayloadMutator } from '../../modules/red/web/vuln/payload/payload.mutator';
import { BrowserService } from './browser.service';

@Injectable()
export class DomXssService {
  constructor(
    private readonly browserService: BrowserService,
    private readonly mutator: PayloadMutator,
  ) {}

  async scan(url: string): Promise<any[]> {
    const browser = await this.browserService.getBrowser();
    const page = await browser.newPage();

    const findings: any[] = [];

    const payloads = this.mutator.generate('xss');

    for (const payload of payloads) {
      let triggered = false;

      page.on('dialog', async dialog => {
        triggered = true;
        await dialog.dismiss();
      });

      await page.goto(`${url}?q=${encodeURIComponent(payload)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });

      await new Promise(r => setTimeout(r, 2000));

      if (triggered) {
        findings.push({
          type: 'DOM XSS',
          payload,
          url,
        });
        break;
      }
    }

    await page.close();
    return findings;
  }
}
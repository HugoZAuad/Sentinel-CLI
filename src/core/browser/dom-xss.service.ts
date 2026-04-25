import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { BrowserService } from './browser.service';

@Injectable()
export class DomXssService {
  constructor(
    private readonly browserService: BrowserService,
    private readonly logger: LoggerService,
  ) {}

  async scan(url: string): Promise<any[]> {
    const page = await this.browserService.newPage();
    const findings: any[] = [];
    const payloads = [
      "<img src=x onerror=alert(1)>",
      "<svg onload=alert(1)>",
      "'\"><script>alert(1)</script>",
    ];

    try {
      for (const payload of payloads) {
        let triggered = false;

        const dialogHandler = async (dialog: any) => {
          triggered = true;
          await dialog.dismiss();
        };

        page.on('dialog', dialogHandler);

        try {
          await page.goto(`${url}?q=${encodeURIComponent(payload)}`, {
            waitUntil: 'domcontentloaded',
            timeout: 8000,
          });

          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          this.logger.warn(`Timeout ou erro ao testar payload em ${url}`);
        } finally {
          page.off('dialog', dialogHandler);
        }

        if (triggered) {
          findings.push({ type: 'DOM XSS', payload, url });
          break;
        }
      }
    } finally {
      await page.close();
    }

    return findings;
  }
}
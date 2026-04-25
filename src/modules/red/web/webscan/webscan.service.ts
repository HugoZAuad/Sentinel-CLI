import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../../../core/browser/browser.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

@Injectable()
export class WebscanService {
  constructor(
    private readonly browser: BrowserService,
    private readonly logger: LoggerService,
  ) {}

  async execute(targetUrl: string): Promise<any[]> {
    const allFindings: any[] = [];
    const page = await this.browser.newPage();

    try {
      this.logger.startTask(`Iniciando Web Scan: ${targetUrl}`);
      
      await page.goto(targetUrl, { waitUntil: 'networkidle2' });

      const xssFindings = await page.evaluate(() => {
        const findings: any[] = [];
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.innerHTML.includes('eval(') || script.innerHTML.includes('innerHTML')) {
            findings.push({
              type: 'DOM XSS Risk',
              evidence: script.innerHTML.substring(0, 100)
            });
          }
        });
        return findings;
      });

      allFindings.push(...xssFindings);

      this.logger.stopTask(`Scan finalizado. ${allFindings.length} vulnerabilidades encontradas.`);
      return allFindings;
    } catch (error) {
      this.logger.error('Erro no WebscanService', error);
      return [];
    } finally {
      await page.close();
    }
  }
}
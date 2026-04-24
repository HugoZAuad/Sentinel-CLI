import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { BrowserService } from './browser.service';

@Injectable()
export class InteractionService {
  constructor(
    private readonly browser: BrowserService,
    private readonly logger: LoggerService,
  ) {}

  async explore(url: string): Promise<string[]> {
    const page = await this.browser.newPage();
    const discovered = new Set<string>();

    try {
      this.logger.info(`Explorando interações em: ${url}`);
      
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      const links = await page.$$eval('a', as =>
        as.map(a => (a as HTMLAnchorElement).href).filter(href => href.startsWith('http'))
      );

      links.forEach(link => discovered.add(link));

      const buttons = await page.$$('button');
      this.logger.info(`Encontrados ${buttons.length} botões. Interagindo com os principais...`);

      for (const btn of buttons.slice(0, 5)) {
        try {
          await btn.click();
          await new Promise(r => setTimeout(r, 800));

          const newLinks = await page.$$eval('a', as => as.map(a => (a as HTMLAnchorElement).href));
          newLinks.forEach(link => discovered.add(link));
        } catch {
        }
      }
    } catch (err) {
      this.logger.error(`Falha ao explorar interações: ${url}`);
    } finally {
      await page.close();
    }

    return Array.from(discovered);
  }
}
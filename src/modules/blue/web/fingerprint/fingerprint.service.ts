import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../../../core/browser/browser.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';

export interface TechProfile {
  name: string;
  category: 'CMS' | 'Framework' | 'Server' | 'Language' | 'Security';
  version?: string;
  isRisk?: boolean;
}

@Injectable()
export class FingerprintService {
  private readonly signatures = [
    { name: 'WordPress', pattern: /wp-content|wp-includes/i, category: 'CMS' },
    { name: 'React', pattern: /id="root"|id="app"|_react|react-dom/i, category: 'Framework' },
    { name: 'Angular', pattern: /ng-version|ng-root|ng-app/i, category: 'Framework' },
    { name: 'Vue', pattern: /v-attr|data-v-|__vue__/i, category: 'Framework' },
    { name: 'Laravel', pattern: /laravel_session|XSRF-TOKEN/i, category: 'Framework' },
    { name: 'Nginx', pattern: /nginx/i, category: 'Server' },
    { name: 'Apache', pattern: /apache/i, category: 'Server' },
    { name: 'Cloudflare', pattern: /cf-ray|__cfduid/i, category: 'Security' },
  ];

  constructor(
    private readonly browser: BrowserService,
    private readonly logger: LoggerService,
  ) {}

  async identify(url: string): Promise<TechProfile[]> {
    const detected: TechProfile[] = [];
    
    try {
      const page = await this.browser.newPage();
      
      let mainResponseHeaders: Record<string, string> = {};

      page.on('response', (response) => {
        const responseUrl = response.url().replace(/\/$/, '');
        const targetSearch = url.replace(/\/$/, '');
        
        if (responseUrl === targetSearch) {
          mainResponseHeaders = response.headers();
        }
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();

      this.analyzeHeaders(mainResponseHeaders, detected);
      this.analyzeSignatures(html, detected);
      this.auditSecurityHeaders(mainResponseHeaders, detected);

      await page.close();
      return this.deduplicate(detected);
    } catch (error) {
      this.logger.error(`Falha no fingerprint de ${url}`, error);
      return [];
    }
  }

  private analyzeHeaders(headers: Record<string, string>, detected: TechProfile[]) {
    if (headers['server']) {
      detected.push({ 
        name: headers['server'], 
        category: 'Server', 
        isRisk: /\d/.test(headers['server']) 
      });
    }

    if (headers['x-powered-by']) {
      detected.push({ 
        name: headers['x-powered-by'], 
        category: 'Language', 
        isRisk: true 
      });
    }
  }

  private analyzeSignatures(html: string, detected: TechProfile[]) {
    for (const sig of this.signatures) {
      if (sig.pattern.test(html)) {
        detected.push({ 
          name: sig.name, 
          category: sig.category as any 
        });
      }
    }
  }

  private auditSecurityHeaders(headers: Record<string, string>, detected: TechProfile[]) {
    const essentialHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options'
    ];

    essentialHeaders.forEach(h => {
      if (!headers[h]) {
        detected.push({ 
          name: `Missing ${h.toUpperCase()}`, 
          category: 'Security', 
          isRisk: true 
        });
      }
    });
  }

  private deduplicate(techs: TechProfile[]): TechProfile[] {
    return Array.from(new Map(techs.map(item => [item.name, item])).values());
  }
}
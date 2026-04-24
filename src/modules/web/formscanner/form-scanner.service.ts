import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { VulnEngine } from '../../vuln/vuln.engine';

@Injectable()
export class FormScannerService {
  constructor(
    private readonly http: HttpService,
    private readonly vulnEngine: VulnEngine,
  ) {}

  async scan(url: string): Promise<any[]> {
    const res = await this.http.get(url);
    if (!res || !res.data) return [];

    const forms = this.extractForms(res.data, url);

    const results: any[] = [];

    for (const form of forms) {
      const findings = await this.vulnEngine.run(
        form.action,
        form.inputs,
        form.method,
      );

      if (findings.length > 0) {
        results.push({
          action: form.action,
          method: form.method,
          findings,
        });
      }
    }
    return results;
  }

  private extractForms(html: string, base: string): any[] {
    const forms: any[] = [];
    const formRegex = /<form[\s\S]*?<\/form>/gi;
    const matches = html.match(formRegex) || [];

    for (const raw of matches) {
      const actionMatch = raw.match(/action=["']?([^"'\s>]+)["']?/i);
      const methodMatch = raw.match(/method=["']?([^"'\s>]+)["']?/i);

      forms.push({
        action: actionMatch ? new URL(actionMatch[1], base).toString() : base,
        method: (methodMatch?.[1] || 'GET').toUpperCase(),
        inputs: this.extractInputs(raw),
      });
    }
    return forms;
  }

  private extractInputs(formHtml: string): string[] {
    const inputRegex =
      /<(input|textarea|select)[^>]*name=["']?([^"'\s>]+)["']?[^>]*>/gi;
    const names: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = inputRegex.exec(formHtml)) !== null) {
      names.push(match[2]);
    }
    return [...new Set(names)];
  }
}

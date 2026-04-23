import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { PayloadMutator } from '../../vuln/payload/payload.mutator';

@Injectable()
export class FormScannerService {
  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator,
  ) {}

  async scan(url: string): Promise<any[]> {
    const res = await this.http.get(url);

    if (!res || !res.data) return [];

    const forms = this.extractForms(res.data, url);

    const results: any[] = [];

    for (const form of forms) {
      const findings = await this.testForm(form);

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

      const inputs = this.extractInputs(raw);

      forms.push({
        action: actionMatch
          ? new URL(actionMatch[1], base).toString()
          : base,
        method: (methodMatch?.[1] || 'GET').toUpperCase(),
        inputs,
      });
    }

    return forms;
  }

  private extractInputs(formHtml: string): string[] {
    const inputs: string[] = [];

    const inputRegex = /<input[^>]*name=["']?([^"'\s>]+)["']?[^>]*>/gi;

    let match;
    while ((match = inputRegex.exec(formHtml))) {
      inputs.push(match[1]);
    }

    return inputs;
  }

  private async testForm(form: any): Promise<string[]> {
    const findings: string[] = [];

    const xssPayloads = this.mutator.generate('xss');
    const sqliPayloads = this.mutator.generate('sqli');

    for (const payload of xssPayloads) {
      const data = this.buildData(form.inputs, payload);

      const res = await this.send(form, data);

      if (res && res.data && res.data.includes(payload)) {
        findings.push(`XSS possível com payload: ${payload}`);
        break;
      }
    }

    for (const payload of sqliPayloads) {
      const data = this.buildData(form.inputs, payload);

      const start = Date.now();
      const res = await this.send(form, data);
      const time = Date.now() - start;

      if (!res) continue;

      const body = res.data.toLowerCase();

      if (
        body.includes('sql') ||
        body.includes('syntax') ||
        body.includes('mysql') ||
        body.includes('error')
      ) {
        findings.push(`SQLi possível (erro): ${payload}`);
        break;
      }

      if (time > 3000) {
        findings.push(`SQLi possível (delay): ${payload}`);
        break;
      }
    }

    return findings;
  }

  private buildData(inputs: string[], payload: string): Record<string, string> {
    const data: Record<string, string> = {};

    inputs.forEach(name => {
      data[name] = payload;
    });

    return data;
  }

  private async send(form: any, data: Record<string, string>) {
    try {
      if (form.method === 'POST') {
        return await this.http.post(form.action, data);
      }

      const query = new URLSearchParams(data).toString();
      return await this.http.get(`${form.action}?${query}`);
    } catch {
      return null;
    }
  }
}
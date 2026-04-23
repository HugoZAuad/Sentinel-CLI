import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { PayloadMutator } from '../../vuln/payload/payload.mutator';

interface FormResult {
  action: string;
  method: string;
  findings: string[];
}

@Injectable()
export class FormScannerService {
  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator,
  ) {}

  async scan(url: string): Promise<FormResult[]> {
    const res = await this.http.get(url);

    if (!res || !res.data) return [];

    const forms = this.extractForms(res.data, url);

    const results: FormResult[] = [];

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

    const inputRegex =
      /<(input|textarea|select)[^>]*name=["']?([^"'\s>]+)["']?[^>]*>/gi;

    let match;
    while ((match = inputRegex.exec(formHtml))) {
      inputs.push(match[2]);
    }

    return [...new Set(inputs)];
  }

  private async testForm(form: any): Promise<string[]> {
    const findings: string[] = [];

    const baseRes = await this.send(form, this.buildData(form.inputs, 'test'));
    if (!baseRes) return [];

    const baseline = baseRes.data.length;

    const xssPayloads = this.mutator.generate('xss');
    const sqliPayloads = this.mutator.generate('sqli');

    for (const payload of xssPayloads) {
      const marker = `xss_${Date.now()}`;
      const finalPayload = payload.replace('alert(1)', marker);

      const res = await this.send(
        form,
        this.buildData(form.inputs, finalPayload),
      );

      if (!res) continue;

      const reflected = res.data.includes(marker);
      const diff = Math.abs(res.data.length - baseline);

      if (reflected && diff > 20) {
        findings.push(`XSS confirmado (${form.action})`);
        break;
      }
    }

    for (const payload of sqliPayloads) {
      const start = Date.now();

      const res = await this.send(
        form,
        this.buildData(form.inputs, payload),
      );

      const time = Date.now() - start;

      if (!res) continue;

      const body = res.data.toLowerCase();
      const diff = Math.abs(res.data.length - baseline);

      if (
        body.includes('sql') ||
        body.includes('syntax') ||
        body.includes('mysql') ||
        body.includes('error')
      ) {
        findings.push(`SQLi erro detectado (${form.action})`);
        break;
      }

      if (time > 3000) {
        findings.push(`SQLi delay detectado (${form.action})`);
        break;
      }

      if (diff > 80) {
        findings.push(`SQLi possível (diferença resposta)`);
        break;
      }
    }

    return findings;
  }

  private buildData(
    inputs: string[],
    payload: string,
  ): Record<string, string> {
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
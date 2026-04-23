import { Injectable } from '@nestjs/common';
import { HttpService } from '../../http/http.service';

export interface FormInput {
  action: string;
  method: 'GET' | 'POST';
  inputs: string[];
}

export interface FormFinding {
  action: string;
  method: string;
  findings: string[];
}

@Injectable()
export class FormScannerService {
  private payloads = {
    xss: `<script>alert(1)</script>`,
    sqli: `' OR '1'='1`,
  };

  constructor(private readonly http: HttpService) {}

  async scanForms(forms: FormInput[]): Promise<FormFinding[]> {
    const results: FormFinding[] = [];

    for (const form of forms) {
      const result = await this.testForm(form);
      if (result) results.push(result);
    }

    return results;
  }

  private async testForm(form: FormInput): Promise<FormFinding | null> {
    const findings: string[] = [];

    for (const input of form.inputs) {
      const xssResult = await this.sendPayload(form, input, this.payloads.xss);
      if (xssResult.includes(this.payloads.xss)) {
        findings.push(`Possível XSS em ${input}`);
      }

      const sqliResult = await this.sendPayload(form, input, this.payloads.sqli);
      if (this.detectSQLi(sqliResult)) {
        findings.push(`Possível SQLi em ${input}`);
      }
    }

    if (findings.length === 0) return null;

    return {
      action: form.action,
      method: form.method,
      findings,
    };
  }

  private async sendPayload(
    form: FormInput,
    input: string,
    payload: string,
  ): Promise<string> {
    try {
      const data: Record<string, string> = {};

      form.inputs.forEach(i => {
        data[i] = i === input ? payload : 'test';
      });

      if (form.method === 'POST') {
        const res = await this.http.post(form.action, data);
        return res.body;
      } else {
        const url = new URL(form.action);
        Object.entries(data).forEach(([k, v]) => url.searchParams.set(k, v));

        const res = await this.http.get(url.toString());
        return res.body;
      }
    } catch {
      return '';
    }
  }

  private detectSQLi(response: string): boolean {
    const errors = [
      'sql syntax',
      'mysql',
      'syntax error',
      'unexpected token',
      'unterminated string',
    ];

    const lower = response.toLowerCase();
    return errors.some(e => lower.includes(e));
  }
}
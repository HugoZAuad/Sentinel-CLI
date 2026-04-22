import { Injectable } from '@nestjs/common';

@Injectable()
export class FormScannerService {
  private payloads = {
    xss: `<script>alert(1)</script>`,
    sqli: `' OR '1'='1`,
  };

  async scanForms(forms: any[]) {
    const results: any[] = [];

    for (const form of forms) {
      const result = await this.testForm(form);
      if (result) results.push(result);
    }

    return results;
  }

  private async testForm(form: any) {
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

  private async sendPayload(form: any, input: string, payload: string) {
    try {
      const data: Record<string, string> = {};

      form.inputs.forEach((i: string) => {
        data[i] = i === input ? payload : 'test';
      });

      if (form.method === 'POST') {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          body: JSON.stringify(data),
        });

        return await res.text();
      } else {
        const url = new URL(form.action);

        Object.entries(data).forEach(([k, v]) => {
          url.searchParams.set(k, v);
        });

        const res = await fetch(url.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });

        return await res.text();
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
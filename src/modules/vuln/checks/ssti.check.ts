import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class SstiCheck implements IVulnCheck {
  readonly name = 'Server-Side Template Injection';

  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, method: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const payload = '{{7*7}}';
    const marker = '49';

    try {
      const res = await (method === 'POST' 
        ? this.http.post(url, { [param]: payload }) 
        : this.http.get(`${url}?${param}=${encodeURIComponent(payload)}`));

      if (res?.data && String(res.data).includes(marker)) {
        findings.push({
          type: 'SSTI',
          severity: 'CRITICAL',
          confidence: 'high',
          evidence: `Reflexão matemática detectada: ${marker}`,
          payload,
          target: url,
          param
        });
      }
    } catch {
      return [];
    }

    return findings;
  }
}
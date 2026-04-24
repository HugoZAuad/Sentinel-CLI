import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class DomXssCheck implements IVulnCheck {
  readonly name = 'DOM-based XSS';

  constructor(private readonly http: HttpService) {}

  async run(url: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const res = await this.http.get(url);
    
    if (!res || !res.data) return [];

    const sourceCode = res.data.toLowerCase();

    const sinks = [
      'eval(',
      'setTimeout(',
      'innerHTML',
      'document.write(',
      'location.href',
      'location.search'
    ];

    const patterns = sinks.filter(sink => sourceCode.includes(sink));

    if (patterns.length > 0) {
      findings.push({
        type: 'Potential DOM XSS',
        severity: 'LOW',
        confidence: 'medium',
        evidence: `Sinks JS perigosos encontrados: ${patterns.join(', ')}`,
        payload: 'N/A (Source Analysis)',
        target: url
      });
    }

    return findings;
  }
}
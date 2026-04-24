import { Injectable } from '@nestjs/common';
import { DomXssService } from '../../../../../core/browser/dom-xss.service';
import { HttpService } from '../../../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class DomXssCheck implements IVulnCheck {
  readonly name = 'DOM-based XSS';

  constructor(
    private readonly http: HttpService,
    private readonly domXss: DomXssService,
  ) {}

  async run(
    url: string,
    _param: string,
    _method: string,
    _baseline: number,
  ): Promise<VulnFinding[]> {
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

    const activeFindings = await this.domXss.scan(url);
    for (const item of activeFindings) {
      findings.push({
        type: item.type || 'DOM XSS',
        severity: 'HIGH',
        confidence: 'high',
        evidence: 'Payload executou JavaScript via contexto DOM.',
        payload: item.payload || 'N/A',
        target: item.url || url,
      });
    }

    return findings;
  }
}
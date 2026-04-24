import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class PassiveCheck implements IVulnCheck {
  readonly name = 'Passive Security Audit';

  constructor(private readonly http: HttpService) {}

  async run(url: string, _param: string, _method: string, _baseline: number): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const res = await this.http.get(url);
    
    if (!res || !res.headers) return [];

    const headers = res.headers;

    if (!headers['strict-transport-security']) {
      findings.push(this.createFinding('HSTS Missing', 'LOW', 'Políticas de transporte estrito não configuradas.', url));
    }

    if (!headers['content-security-policy']) {
      findings.push(this.createFinding('CSP Missing', 'MEDIUM', 'Content Security Policy não detectada. Risco de injeção aumentado.', url));
    }

    if (headers['x-powered-by'] || headers['server']) {
      const info = headers['x-powered-by'] || headers['server'];
      findings.push(this.createFinding('Server Information Disclosure', 'LOW', `Versão exposta: ${info}`, url));
    }

    return findings;
  }

  private createFinding(type: string, severity: any, evidence: string, target: string): VulnFinding {
    return {
      type,
      severity,
      confidence: 'high',
      evidence,
      payload: 'N/A (Passive Scan)',
      target
    };
  }
}
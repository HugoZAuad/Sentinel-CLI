import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class SqliCheck implements IVulnCheck {
  readonly name = 'SQL Injection';

  constructor(private readonly http: HttpService) {}

  async run(
    url: string, 
    param: string, 
    method: string, 
    baseline: number
  ): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    
    const payloads = ["'", "''", '"', ' OR 1=1--', ' OR 1=1#', '\\'];

    for (const payload of payloads) {
      const target = this.inject(url, param, payload);
      
      try {
        const res = await (method === 'POST' 
          ? this.http.post(url, { [param]: payload }) 
          : this.http.get(target));

        if (!res || !res.data) continue;

        const body = res.data.toLowerCase();
        
        const hasSqlError = 
          body.includes('sql syntax') || 
          body.includes('mysql_fetch') || 
          body.includes('native client') || 
          body.includes('ora-00933') || 
          body.includes('sqlite3::ioerror');

        if (hasSqlError) {
          findings.push({
            type: 'SQL Injection (Error Based)',
            severity: 'CRITICAL',
            confidence: 'HIGH',
            evidence: 'Mensagem de erro de banco de dados detectada na resposta.',
            payload: payload,
            target: url,
            param: param
          });
          break; 
        }

        const currentLength = res.data.length;
        const diff = Math.abs(baseline - currentLength);

        if (diff > 100) {
          findings.push({
            type: 'SQL Injection (Potential)',
            severity: 'HIGH',
            confidence: 'MEDIUM',
            evidence: `Diferença significativa no tamanho da resposta (${diff} bytes).`,
            payload: payload,
            target: url,
            param: param
          });
          break;
        }

      } catch (err) {
        continue;
      }
    }

    return findings;
  }

  private inject(url: string, param: string, payload: string): string {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set(param, payload);
      return parsed.toString();
    } catch {
      return url;
    }
  }
}
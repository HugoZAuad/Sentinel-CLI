import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../../../core/http/http.service';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class RedirectCheck implements IVulnCheck {
  readonly name = 'Open Redirect';

  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, method: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const payload = 'https://google.com';
    
    try {
      const res = await (method === 'POST' 
        ? this.http.post(url, { [param]: payload }) 
        : this.http.get(`${url}?${param}=${payload}`));

      if (res && typeof res.status === 'number') {
        
        const isRedirect = res.status >= 300 && res.status < 400;
        const locationHeader = res.headers?.['location'];

        if (isRedirect && locationHeader?.includes(payload)) {
          findings.push({
            type: 'Open Redirect',
            severity: 'MEDIUM',
            confidence: 'high',
            evidence: `Redirecionamento externo detectado via status ${res.status}. Header Location: ${locationHeader}`,
            payload,
            target: url,
            param
          });
        }
      }
    } catch (error) {
    }

    return findings;
  }
}
import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../../../core/http/http.service';
import { PayloadMutator } from '../payload/payload.mutator';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class LfiCheck implements IVulnCheck {
  readonly name = 'Local File Inclusion';

  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator
  ) {}

  async run(url: string, param: string, method: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const payloads = this.mutator.generate('lfi');
    
    const markers = ['root:x:0:0:', '[extensions]', '[fonts]', 'win.ini'];

    for (const payload of payloads) {
      try {
        const res = await (method === 'POST' 
          ? this.http.post(url, { [param]: payload }) 
          : this.http.get(`${url}?${param}=${payload}`));

        if (!res || !res.data) continue;

        const body = String(res.data);
        const detected = markers.find(m => body.includes(m));

        if (detected) {
          findings.push({
            type: 'Local File Inclusion (LFI)',
            severity: 'CRITICAL',
            confidence: 'high',
            evidence: `Padrão de arquivo de sistema detectado: "${detected}"`,
            payload,
            target: url,
            param
          });
          break; 
        }
      } catch {
        continue;
      }
    }
    return findings;
  }
}
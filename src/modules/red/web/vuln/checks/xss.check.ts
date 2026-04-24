import { Injectable } from '@nestjs/common';
import { HttpService } from '../../../../../core/http/http.service';
import { PayloadMutator } from '../payload/payload.mutator';
import { IVulnCheck, VulnFinding } from '../vuln-check.interface';

@Injectable()
export class XssCheck implements IVulnCheck {
  readonly name = 'XSS';

  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator
  ) {}

  async run(url: string, param: string, method: string, baseline: number): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    const payloads = this.mutator.generate('xss');

    for (const payload of payloads) {
      const marker = `xss_${Date.now()}`;
      const finalPayload = payload.replace('alert(1)', marker);
      
      const data = { [param]: finalPayload };
      const res = await (method === 'POST' 
        ? this.http.post(url, data) 
        : this.http.get(`${url}?${new URLSearchParams(data).toString()}`));

      if (res?.data?.includes(marker)) {
        findings.push({
          type: 'Cross-Site Scripting (XSS)',
          severity: 'HIGH',
          confidence: 'high',
          evidence: `Payload refletido no corpo da resposta (Reflected XSS)`,
          payload: finalPayload,
          target: url,
          param
        });
        break;
      }
    }
    return findings;
  }
}
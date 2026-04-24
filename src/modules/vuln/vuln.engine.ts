import { Injectable } from '@nestjs/common';
import { IVulnCheck, VulnFinding } from './vuln-check.interface';
import { XssCheck } from './checks/xss.check';
import { SqliCheck } from './checks/sqli.check';
import { HttpService } from '../../core/http/http.service';

@Injectable()
export class VulnEngine {
  private readonly checks: IVulnCheck[];

  constructor(
    xss: XssCheck,
    sqli: SqliCheck,
    private readonly http: HttpService,
  ) {
    this.checks = [xss, sqli];
  }

  async run(url: string, params: string[], method = 'GET'): Promise<VulnFinding[]> {
    const results: VulnFinding[] = [];
    const baseRes = await this.http.get(url);
    const baseline = baseRes?.data?.length || 0;

    for (const param of params) {
      for (const check of this.checks) {
        try {
          const findings = await check.run(url, param, method, baseline);
          results.push(...findings);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[VulnEngine] Error in check ${check.name}:`, message);
        }
      }
    }
    return results;
  }
}
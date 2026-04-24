import { Injectable } from '@nestjs/common';
import { HttpService } from '../../core/http/http.service';
import { DomXssCheck } from './checks/domxss.check';
import { PassiveCheck } from './checks/passive.check';
import { RedirectCheck } from './checks/redirect.check';
import { SensitiveFileCheck } from './checks/sensitive-file.check';
import { SqliCheck } from './checks/sqli.check';
import { XssCheck } from './checks/xss.check';
import { IVulnCheck, VulnFinding } from './vuln-check.interface';

@Injectable()
export class VulnEngine {
  private readonly checks: IVulnCheck[];

  constructor(
    private readonly http: HttpService,
    xss: XssCheck,
    sqli: SqliCheck,
    passive: PassiveCheck,
    sensitive: SensitiveFileCheck,
    redirect: RedirectCheck,
    domXss: DomXssCheck,   
  ) {
    this.checks = [passive, sensitive, domXss, redirect, xss, sqli];
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
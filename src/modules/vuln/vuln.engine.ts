import { Injectable } from '@nestjs/common';
import { HttpService } from '../../core/http/http.service';
import { PayloadMutator } from './payload/payload.mutator';

type VulnType = 'xss' | 'sqli' | 'redirect';

interface VulnFinding {
  type: string;
  url: string;
  param: string;
  payload: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
}

@Injectable()
export class VulnEngine {
  private concurrency = 5;

  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator,
  ) {}

  async run(url: string, params: string[]): Promise<VulnFinding[]> {
    const tasks: (() => Promise<VulnFinding[]>)[] = [];

    for (const param of params) {
      tasks.push(() => this.testParam(url, param));
    }

    return this.runWithLimit(tasks, this.concurrency);
  }

  private async testParam(url: string, param: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];

    const baseRes = await this.safeRequest(url);
    if (!baseRes) return [];

    const baseLength = baseRes.data.length;

    const xssPayloads = this.mutator.generate('xss');
    const sqliPayloads = this.mutator.generate('sqli');
    const redirectPayloads = this.mutator.generate('redirect');

    for (const payload of xssPayloads) {
      const target = this.inject(url, param, payload);
      const res = await this.safeRequest(target);

      if (!res) continue;

      const reflected = res.data.includes(payload);

      if (reflected && Math.abs(res.data.length - baseLength) > 5) {
        findings.push({
          type: 'XSS',
          url: target,
          param,
          payload,
          severity: 'HIGH',
          evidence: 'Payload refletido na resposta',
        });
        break;
      }
    }

    for (const payload of sqliPayloads) {
      const target = this.inject(url, param, payload);

      const start = Date.now();
      const res = await this.safeRequest(target);
      const time = Date.now() - start;

      if (!res) continue;

      const body = res.data.toLowerCase();

      if (
        body.includes('sql') ||
        body.includes('syntax') ||
        body.includes('mysql') ||
        body.includes('error')
      ) {
        findings.push({
          type: 'SQL Injection',
          url: target,
          param,
          payload,
          severity: 'CRITICAL',
          evidence: 'Erro SQL detectado',
        });
        break;
      }

      if (time > 3000) {
        findings.push({
          type: 'SQL Injection',
          url: target,
          param,
          payload,
          severity: 'CRITICAL',
          evidence: `Delay detectado (${time}ms)`,
        });
        break;
      }

      if (Math.abs(res.data.length - baseLength) > 50) {
        findings.push({
          type: 'SQL Injection',
          url: target,
          param,
          payload,
          severity: 'HIGH',
          evidence: 'Diferença significativa de resposta',
        });
        break;
      }
    }

    for (const payload of redirectPayloads) {
      const target = this.inject(url, param, payload);
      const res = await this.safeRequest(target, false);

      if (!res) continue;

      if (res.status === 301 || res.status === 302) {
        const location = res.headers['location'] || '';

        if (location.includes('evil.com') && !location.includes(new URL(url).hostname)) {
          findings.push({
            type: 'Open Redirect',
            url: target,
            param,
            payload,
            severity: 'MEDIUM',
            evidence: `Redirect para ${location}`,
          });
          break;
        }
      }
    }

    return findings;
  }

  private inject(url: string, param: string, payload: string): string {
    const u = new URL(url);
    u.searchParams.set(param, payload);
    return u.toString();
  }

  private async safeRequest(url: string, followRedirect = true) {
    try {
      return await this.http.get(url, { followRedirect });
    } catch {
      return null;
    }
  }

  private async runWithLimit(
    tasks: (() => Promise<VulnFinding[]>)[],
    limit: number,
  ): Promise<VulnFinding[]> {
    const results: VulnFinding[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const p = task().then(res => {
        results.push(...res);
      });

      executing.push(p);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(e => e === p),
          1,
        );
      }
    }

    await Promise.all(executing);

    return results;
  }
}
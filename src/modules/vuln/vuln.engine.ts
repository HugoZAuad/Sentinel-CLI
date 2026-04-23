import { Injectable } from '@nestjs/common';
import { HttpService } from '../../core/http/http.service';
import { PayloadMutator } from './payload/payload.mutator';

interface VulnFinding {
  type: string;
  url: string;
  param: string;
  payload: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
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
    const tasks = params.map(p => () => this.testParam(url, p));
    return this.limit(tasks, this.concurrency);
  }

  private async testParam(url: string, param: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];

    const baseA = await this.safe(url);
    const baseB = await this.safe(url);

    if (!baseA || !baseB) return [];

    const baseline = (baseA.data.length + baseB.data.length) / 2;

    const xssPayloads = this.mutator.generate('xss');

    for (const payload of xssPayloads) {
      const marker = `xss_${Date.now()}`;
      const finalPayload = payload.replace('alert(1)', marker);

      const target = this.inject(url, param, finalPayload);
      const res = await this.safe(target);

      if (!res) continue;

      const reflected = res.data.includes(marker);
      const diff = Math.abs(res.data.length - baseline);

      if (reflected && diff > 20) {
        findings.push({
          type: 'XSS',
          url: target,
          param,
          payload: finalPayload,
          severity: 'HIGH',
          confidence: diff > 50 ? 'HIGH' : 'MEDIUM',
          evidence: 'Reflexão com alteração de resposta',
        });
        break;
      }
    }

    const sqliPayloads = this.mutator.generate('sqli');

    for (const payload of sqliPayloads) {
      const target = this.inject(url, param, payload);

      const start = Date.now();
      const res = await this.safe(target);
      const time = Date.now() - start;

      if (!res) continue;

      const body = res.data.toLowerCase();
      const diff = Math.abs(res.data.length - baseline);

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
          confidence: 'HIGH',
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
          confidence: 'HIGH',
          evidence: `Delay detectado (${time}ms)`,
        });
        break;
      }

      if (diff > 80) {
        findings.push({
          type: 'SQL Injection',
          url: target,
          param,
          payload,
          severity: 'HIGH',
          confidence: 'MEDIUM',
          evidence: 'Diferença significativa de resposta',
        });
        break;
      }
    }

    const redirectPayloads = this.mutator.generate('redirect');

    for (const payload of redirectPayloads) {
      const target = this.inject(url, param, payload);
      const res = await this.safe(target, false);

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
            confidence: 'HIGH',
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

  private async safe(url: string, followRedirect = true) {
    try {
      return await this.http.get(url, { followRedirect });
    } catch {
      return null;
    }
  }

  private async limit(tasks: any[], limit: number) {
    const results: any[] = [];
    const running: Promise<void>[] = [];

    for (const task of tasks) {
      const p = task().then(r => results.push(...r));
      running.push(p);

      if (running.length >= limit) {
        await Promise.race(running);
        running.splice(running.indexOf(p), 1);
      }
    }

    await Promise.all(running);
    return results;
  }
}
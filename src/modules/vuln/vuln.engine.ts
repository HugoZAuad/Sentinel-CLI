import { Injectable } from '@nestjs/common';
import { HttpService } from '../../core/http/http.service';
import { runWithLimit } from '../../shared/utils/concurrency.util';
import { PayloadMutator } from './payload/payload.mutator';

type Confidence = 'low' | 'medium' | 'high';

interface Finding {
  type: string;
  url: string;
  param: string;
  payload: string;
  confidence: Confidence;
}

@Injectable()
export class VulnEngine {
  private CONCURRENCY = 5;

  constructor(
    private readonly http: HttpService,
    private readonly mutator: PayloadMutator,
  ) {}

  async run(url: string, params: string[]): Promise<Finding[]> {
    const tasks: (() => Promise<Finding | null>)[] = [];

    for (const param of params) {
      tasks.push(() => this.testXSS(url, param));
      tasks.push(() => this.testSQLi(url, param));
      tasks.push(() => this.testRedirect(url, param));
    }

    const results = await runWithLimit(tasks, this.CONCURRENCY);

    return results.filter((r): r is Finding => r !== null);
  }

  private async testXSS(url: string, param: string): Promise<Finding | null> {
    const payloads = this.mutator.generate('xss');

    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const res = await this.http.get(target);
      if (!res) continue;

      const reflected = res.data.includes(payload);
      if (!reflected) continue;

      const executable =
        res.data.includes(`<script>${payload}</script>`) ||
        res.data.includes(`onerror=${payload}`) ||
        res.data.includes(`onload=${payload}`);

      return {
        type: 'XSS',
        url: target,
        param,
        payload,
        confidence: executable ? 'high' : 'medium',
      };
    }

    return null;
  }

  private async testSQLi(url: string, param: string): Promise<Finding | null> {
    const payloads = this.mutator.generate('sqli');

    const base = await this.http.get(url);
    if (!base) return null;

    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const injected = await this.http.get(target);
      if (!injected) continue;

      const body = injected.data.toLowerCase();

      const errorBased =
        body.includes('sql') ||
        body.includes('syntax') ||
        body.includes('mysql') ||
        body.includes('warning');

      const diffLength =
        Math.abs(base.data.length - injected.data.length) > 20;

      if (errorBased) {
        return {
          type: 'SQLi',
          url: target,
          param,
          payload,
          confidence: 'high',
        };
      }

      if (diffLength) {
        return {
          type: 'SQLi',
          url: target,
          param,
          payload,
          confidence: 'medium',
        };
      }
    }

    const timePayload = `' OR sleep(3) --`;
    const target = this.inject(url, param, timePayload);

    const start = Date.now();
    await this.http.get(target);
    const delay = Date.now() - start;

    if (delay > 2500) {
      return {
        type: 'SQLi',
        url: target,
        param,
        payload: timePayload,
        confidence: 'high',
      };
    }

    return null;
  }

  private async testRedirect(url: string, param: string): Promise<Finding | null> {
    const payloads = this.mutator.generate('redirect');

    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const res = await this.http.get(target);
      if (!res) continue;

      if (res.status === 301 || res.status === 302) {
        const location = res.headers['location'];

        if (location) {
          try {
            const host = new URL(location).hostname;

            if (host.includes('evil.com')) {
              return {
                type: 'Open Redirect',
                url: target,
                param,
                payload,
                confidence: 'high',
              };
            }
          } catch {}
        }
      }
    }

    return null;
  }

  private inject(url: string, param: string, payload: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set(param, payload);
    return parsed.toString();
  }
}
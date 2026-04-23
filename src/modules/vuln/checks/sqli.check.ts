import { HttpService } from '../../../core/http/http.service';

export class SqliCheck {
  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, payloads: string[]) {
    const base = await this.http.get(url);
    if (!base || !base.data) return null;

    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const res = await this.http.get(target);
      if (!res || !res.data) continue;

      const body = res.data.toLowerCase();

      const errorBased =
        body.includes('sql') ||
        body.includes('syntax') ||
        body.includes('mysql') ||
        body.includes('warning');

      const diff =
        Math.abs(base.data.length - res.data.length) > 20;

      if (errorBased) {
        return {
          type: 'SQLi',
          url: target,
          param,
          payload,
          confidence: 'high',
        };
      }

      if (diff) {
        return {
          type: 'SQLi',
          url: target,
          param,
          payload,
          confidence: 'medium',
        };
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
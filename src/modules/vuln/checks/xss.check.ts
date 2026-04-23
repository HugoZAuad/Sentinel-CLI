import { HttpService } from '../../../core/http/http.service';

export class XssCheck {
  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, payloads: string[]) {
    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const res = await this.http.get(target);
      if (!res || !res.data) continue;

      if (res.data.includes(payload)) {
        return {
          type: 'XSS',
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
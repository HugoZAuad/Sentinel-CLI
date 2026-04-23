import { HttpService } from '../../../core/http/http.service';

export class RedirectCheck {
  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, payloads: string[]) {
    for (const payload of payloads) {
      const target = this.inject(url, param, payload);

      const res = await this.http.get(target);
      if (!res) continue;

      if (res.status === 301 || res.status === 302) {
        const location = res.headers?.['location'];

        if (!location) continue;

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

    return null;
  }

  private inject(url: string, param: string, payload: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set(param, payload);
    return parsed.toString();
  }
}
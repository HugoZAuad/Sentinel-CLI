import { Injectable } from '@nestjs/common';
import { HttpService } from '../../http/http.service';

@Injectable()
export class EndpointService {
  private wordlist = [
    'admin', 'login', 'dashboard', 'api', 'user', 'users',
    'auth', 'config', 'backup', 'test', 'dev', 'staging',
    'debug', 'console', 'panel', 'private', 'uploads', 'files', 'data',
  ];

  private concurrency = 10;

  constructor(private readonly http: HttpService) {}

  async discover(baseUrl: string): Promise<string[]> {
    const found: string[] = [];
    const queue = [...this.wordlist];
    let active = 0;

    return new Promise(resolve => {
      const next = () => {
        if (queue.length === 0 && active === 0) {
          return resolve(found);
        }

        while (active < this.concurrency && queue.length > 0) {
          const path = queue.shift()!;
          active++;

          const url = `${baseUrl.replace(/\/$/, '')}/${path}`;

          this.checkEndpoint(url)
            .then(ok => {
              if (ok) found.push(url);
            })
            .finally(() => {
              active--;
              next();
            });
        }
      };

      next();
    });
  }

  private async checkEndpoint(url: string): Promise<boolean> {
    try {
      const res = await this.http.get(url, { retries: 0 });

      return res.status === 200 || res.status === 401 || res.status === 403;
    } catch {
      return false;
    }
  }
}
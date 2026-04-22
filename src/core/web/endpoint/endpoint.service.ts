import { Injectable } from '@nestjs/common';

@Injectable()
export class EndpointService {
  private wordlist = [
    'admin',
    'login',
    'dashboard',
    'api',
    'user',
    'users',
    'auth',
    'config',
    'backup',
    'test',
    'dev',
    'staging',
    'debug',
    'console',
    'panel',
    'private',
    'uploads',
    'files',
    'data'
  ];

  private concurrency = 10;

  async discover(baseUrl: string): Promise<string[]> {
    const found: string[] = [];
    const queue = [...this.wordlist];

    let active = 0;

    return new Promise(resolve => {
      const next = async () => {
        if (queue.length === 0 && active === 0) {
          return resolve(found);
        }

        while (active < this.concurrency && queue.length > 0) {
          const path = queue.shift()!;
          active++;

          const url = `${baseUrl.replace(/\/$/, '')}/${path}`;

          this.checkEndpoint(url)
            .then(ok => {
              if (ok) {
                found.push(url);
              }
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
      const res = await fetch(url, { method: 'GET' });

      if (res.status === 200) return true;
      if (res.status === 401) return true;
      if (res.status === 403) return true;

      return false;
    } catch {
      return false;
    }
  }
}
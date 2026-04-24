import { Injectable } from '@nestjs/common';

@Injectable()
export class EndpointService {
  private wordlist = ['admin', 'login', 'dashboard', 'api', 'test'];

  async discover(baseUrl: string): Promise<string[]> {
    const found: string[] = [];

    for (const path of this.wordlist) {
      const url = `${baseUrl}/${path}`;

      try {
        const res = await fetch(url);

        if (res.status < 400) {
          found.push(url);
        }
      } catch {}
    }

    return found;
  }
}
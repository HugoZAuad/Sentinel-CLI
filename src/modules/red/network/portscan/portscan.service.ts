import { Injectable } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class PortscanService {
  private commonPorts: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    445: 'SMB',
    3306: 'MySQL',
    5432: 'PostgreSQL',
    8080: 'HTTP-Proxy',
    27017: 'MongoDB',
  };

  /**
   * Tenta conectar e capturar o banner em um único fluxo de socket
   */
  private async probePort(
    host: string,
    port: number,
    timeout = 1500,
  ): Promise<any | null> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let banner = '';
      let isResolved = false;

      socket.setTimeout(timeout);

      socket.connect(port, host, () => {
        if ([80, 443, 8080].includes(port)) {
          socket.write('HEAD / HTTP/1.1\r\nHost: ' + host + '\r\n\r\n');
        } else {
          socket.write('\r\n');
        }
      });

      socket.on('data', (data) => {
        banner += data
          .toString()
          .replace(/[\r\n\t]/g, ' ')
          .trim();
        socket.destroy();
      });

      socket.on('timeout', () => {
        if (!isResolved) {
          socket.destroy();

          resolve(banner ? { port, banner } : null);
          isResolved = true;
        }
      });

      socket.on('error', () => {
        if (!isResolved) {
          resolve(null);
          isResolved = true;
        }
      });

      socket.on('close', () => {
        if (!isResolved) {
          const service = this.commonPorts[port] || 'Unknown';
          resolve(
            banner
              ? { port, service, banner: banner.substring(0, 64) }
              : { port, service, banner: 'No banner' },
          );
          isResolved = true;
        }
      });
    });
  }

  async scanRange(
    host: string,
    startPort: number,
    endPort: number,
    onProgress?: () => void,
  ): Promise<any[]> {
    const results: any[] = [];
    const concurrency = 64;

    for (let port = startPort; port <= endPort; port += concurrency) {
      const limit = Math.min(port + concurrency, endPort + 1);

      // CORREÇÃO: Definimos explicitamente que o array aceita Promessas
      const batch: Promise<any>[] = [];

      for (let p = port; p < limit; p++) {
        batch.push(
          (async (pNum) => {
            const result = await this.probePort(host, pNum);
            if (onProgress) onProgress();
            return result;
          })(p),
        );
      }

      const batchResults = await Promise.all(batch);
      results.push(...batchResults.filter(Boolean));
    }

    return results;
  }
}

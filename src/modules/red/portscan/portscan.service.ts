import { Injectable } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class PortscanService {
  private commonPorts: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'TELNET',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    3306: 'MySQL',
    5432: 'PostgreSQL',
    6379: 'Redis',
    8080: 'HTTP-ALT',
  };

  scanPort(host: string, port: number, timeout = 1000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();

      socket.setTimeout(timeout);

      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.once('error', () => {
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  getService(port: number): string {
    return this.commonPorts[port] || 'Unknown';
  }

  async scanRange(host: string, startPort: number, endPort: number) {
    const results: { port: number; service: string }[] = [];

    const ports: number[] = [];
    for (let port = startPort; port <= endPort; port++) {
      ports.push(port);
    }

    const concurrency = 100;

    for (let i = 0; i < ports.length; i += concurrency) {
      const chunk = ports.slice(i, i + concurrency);

      const promises = chunk.map(async (port) => {
        const isOpen = await this.scanPort(host, port);

        if (isOpen) {
          const service = this.getService(port);

          console.log(`🟢 ${port} | ${service}`);

          return { port, service };
        }

        return null;
      });

      const resultsChunk = await Promise.all(promises);

      results.push(...resultsChunk.filter(Boolean) as { port: number; service: string }[]);
    }

    return results;
  }
}
import { Injectable } from '@nestjs/common';
import * as net from 'net';

@Injectable()
export class PortscanService {
  private commonPorts: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    80: 'HTTP',
    443: 'HTTPS',
    3306: 'MySQL',
  };

  getService(port: number): string {
    return this.commonPorts[port] || 'Unknown';
  }

  // 🔍 Banner grabbing
  grabBanner(host: string, port: number, timeout = 1000): Promise<string> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let banner = '';

      socket.setTimeout(timeout);

      socket.connect(port, host, () => {
        socket.write('\r\n'); // força resposta
      });

      socket.on('data', (data) => {
        banner += data.toString();
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(banner.trim() || 'No banner');
      });

      socket.on('error', () => {
        resolve('No banner');
      });

      socket.on('close', () => {
        resolve(banner.trim() || 'No banner');
      });
    });
  }

  async scanRange(
    host: string,
    startPort: number,
    endPort: number,
    onProgress?: () => void,
    onOpenPort?: (data: any) => void,
  ) {
    const results: any[] = [];

    const ports: number[] = [];
    for (let port = startPort; port <= endPort; port++) {
      ports.push(port);
    }

    const concurrency = 100;

    for (let i = 0; i < ports.length; i += concurrency) {
      const chunk = ports.slice(i, i + concurrency);

      const promises = chunk.map(async (port) => {
        const isOpen = await this.scanPort(host, port);

        if (onProgress) onProgress();

        if (isOpen) {
          const service = this.getService(port);
          const banner = await this.grabBanner(host, port);

          const result = { port, service, banner };

          if (onOpenPort) {
            onOpenPort(result);
          }

          return result;
        }

        return null;
      });

      const resultsChunk = await Promise.all(promises);
      results.push(...resultsChunk.filter(Boolean));
    }

    return results;
  }

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
}
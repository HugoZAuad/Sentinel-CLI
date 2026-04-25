import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import * as cliProgress from 'cli-progress';
import * as net from 'net';

@Injectable()
export class PortscanService {
  async scanRange(host: string, start: number, end: number): Promise<any[]> {
    const openPorts: any[] = [];
    const totalPorts = end - start + 1;
    const concurrencyLimit = 50;

    const progressBar = new cliProgress.SingleBar({
      format: `${chalk.red('Sentinel Scan')} {bar} | {percentage}% | {value}/{total} Ports | Analisando: {port}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(totalPorts, 0, { port: 'Iniciando' });

    for (let i = start; i <= end; i += concurrencyLimit) {
      const currentBatch: number[] = [];
      for (let j = 0; j < concurrencyLimit && (i + j) <= end; j++) {
        currentBatch.push(i + j);
      }

      await Promise.all(currentBatch.map(async (port) => {
        try {
          const isOpen = await this.checkPort(host, port);
          if (isOpen) {
            const banner = await this.grabBanner(host, port);
            openPorts.push({
              port,
              service: this.inferService(port),
              banner: banner
            });
          }
        } finally {
          progressBar.increment(1, { port: port.toString() });
        }
      }));
    }

    progressBar.stop();
    return openPorts.sort((a, b) => a.port - b.port);
  }

  private checkPort(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(300);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  private async grabBanner(host: string, port: number): Promise<string> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let banner = 'N/A';

      socket.setTimeout(500);
      
      socket.on('data', (data) => {
        banner = data.toString().replace(/[\r\n]/g, ' ').trim();
        socket.destroy();
      });

      socket.on('error', () => resolve('N/A'));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(banner);
      });

      socket.connect(port, host);
      
      if (port === 80 || port === 443) {
        socket.write('HEAD / HTTP/1.1\r\nHost: ' + host + '\r\n\r\n');
      }
    });
  }

  private inferService(port: number): string {
    const services: Record<number, string> = {
      21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
      80: 'HTTP', 443: 'HTTPS', 3306: 'MySQL', 5432: 'PostgreSQL',
      8080: 'HTTP-Proxy', 27017: 'MongoDB'
    };
    return services[port] || 'Unknown';
  }
}
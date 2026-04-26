import { Injectable } from '@nestjs/common';
import { PrismaService } from '../service/prisma.service';

@Injectable()
export class ScanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFullScan(target: string, score: number, mode: string, findings: any[]) {
    return this.prisma.scan.create({
      data: {
        target,
        score,
        mode,
        findings: {
          create: findings.map(f => ({
            type: f.type,
            evidence: String(f.evidence),
            severity: f.severity,
            team: f.team,
          })),
        },
      },
      include: { findings: true },
    });
  }

  async createNetworkScan(target: string, startPort: number, endPort: number, ports: any[]) {
    return this.prisma.networkScan.create({
      data: {
        target,
        startPort,
        endPort,
        ports: {
          create: ports.map(p => ({
            port: p.port,
            service: p.service,
            banner: String(p.banner),
          })),
        },
      },
      include: { ports: true },
    });
  }
}
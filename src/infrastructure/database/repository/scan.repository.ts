import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScanMeta } from '../../report/report.types';
import { PrismaService } from '../service/prisma.service';

@Injectable()
export class ScanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFullScan(target: string, score: number, mode: string, findings: any[], meta?: ScanMeta) {
    return this.prisma.scan.create({
      data: {
        target,
        score,
        mode,
        duration: meta?.duration,
        portsScanned: meta?.portsScanned,
        endpointsAnalyzed: meta?.endpointsAnalyzed ?? meta?.endpointsScanned,
        endpointsDiscovered: meta?.endpointsDiscovered,
        headersAnalyzed: meta?.headersAnalyzed,
        endpointDetails: meta?.endpointDetails
          ? (JSON.parse(JSON.stringify(meta.endpointDetails)) as Prisma.InputJsonValue)
          : undefined,
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

  async findFullScanById(scanId: string) {
    return this.prisma.scan.findUnique({
      where: { id: scanId },
      include: { findings: true },
    });
  }
}
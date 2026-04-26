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
            severity: f.severity || 'LOW',
            team: f.team,
          })),
        },
      },
      include: { findings: true },
    });
  }
}
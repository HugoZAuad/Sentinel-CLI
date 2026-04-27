import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { ScanRepository } from '../database/repository/scan.repository';
import { buildReportHtml } from './report-html.template';
import { EndpointAnalysisDetail, Finding, ScanMeta } from './report.types';

export type { EndpointAnalysisDetail, Finding, ScanMeta } from './report.types';

@Injectable()
export class ReportService {
  constructor(private readonly scanRepository: ScanRepository) {}

  async generatePdf(
    target: string,
    score: number,
    findings: Finding[],
    meta?: ScanMeta,
    scanId?: string,
  ): Promise<string> {
    let resolvedTarget = target;
    let resolvedScore = score;
    let resolvedFindings = findings;

    if (scanId) {
      const storedScan = await this.scanRepository.findFullScanById(scanId);

      if (storedScan) {
        resolvedTarget = storedScan.target;
        resolvedScore = storedScan.score;
        resolvedFindings = storedScan.findings.map((finding) => ({
          type: finding.type,
          evidence: finding.evidence,
          severity: finding.severity as Finding['severity'],
          team: finding.team as Finding['team'],
        }));

        meta = meta ?? {};
        meta.duration = storedScan.duration ?? meta.duration;
        meta.portsScanned = storedScan.portsScanned ?? meta.portsScanned;
        meta.endpointsAnalyzed = storedScan.endpointsAnalyzed ?? meta.endpointsAnalyzed;
        meta.endpointsDiscovered = storedScan.endpointsDiscovered ?? meta.endpointsDiscovered;
        meta.headersAnalyzed = storedScan.headersAnalyzed ?? meta.headersAnalyzed;

        if (Array.isArray(storedScan.endpointDetails)) {
          meta.endpointDetails = storedScan.endpointDetails as unknown as EndpointAnalysisDetail[];
        }
      }
    }

    const redFindings = resolvedFindings.filter((f) => f.team === 'RED');
    const blueFindings = resolvedFindings.filter((f) => f.team === 'BLUE');

    const redWeb = redFindings.filter((f) => f.category === 'webscan');
    const redPort = redFindings.filter((f) => f.category === 'portscan');
    const blueWeb = blueFindings.filter((f) => f.category === 'webscan');
    const bluePort = blueFindings.filter((f) => f.category === 'portscan');

    const redWebFallback = redWeb.length === 0 && redPort.length === 0 ? redFindings : redWeb;
    const blueWebFallback = blueWeb.length === 0 && bluePort.length === 0 ? blueFindings : blueWeb;

    const scoreColor = resolvedScore >= 80 ? '#00c896' : resolvedScore >= 50 ? '#f5a623' : '#e8394a';
    const scoreLabel = resolvedScore >= 80 ? 'SEGURO' : resolvedScore >= 50 ? 'ATENÇÃO' : 'CRÍTICO';
    const scoreBg =
      resolvedScore >= 80 ? 'rgba(0,200,150,0.08)' : resolvedScore >= 50 ? 'rgba(245,166,35,0.08)' : 'rgba(232,57,74,0.08)';

    const severityPoints: Record<Finding['severity'], number> = {
      LOW: 2,
      MEDIUM: 5,
      HIGH: 10,
      CRITICAL: 20,
    };

    const categoryWeight: Record<NonNullable<Finding['category']>, number> = {
      webscan: 1.15,
      portscan: 0.4,
    };

    const findingImpact = (finding: Finding): number => {
      const basePoints = severityPoints[finding.severity];
      const weight = categoryWeight[finding.category ?? 'webscan'] ?? 1;
      return Math.max(1, Math.round(basePoints * weight));
    };

    const totalCritical = resolvedFindings.filter((f) => f.severity === 'CRITICAL').length;
    const totalHigh     = resolvedFindings.filter((f) => f.severity === 'HIGH').length;
    const totalMedium   = resolvedFindings.filter((f) => f.severity === 'MEDIUM').length;
    const totalLow      = resolvedFindings.filter((f) => f.severity === 'LOW').length;
    const maxBar        = Math.max(totalCritical, totalHigh, totalMedium, totalLow, 1);
    const totalFindings = resolvedFindings.length;
    const totalRed = redFindings.length;
    const totalBlue = blueFindings.length;
    const redShare = totalFindings > 0 ? Math.round((totalRed / totalFindings) * 100) : 0;
    const blueShare = totalFindings > 0 ? 100 - redShare : 0;
    const scoreImpact = resolvedFindings.reduce((total, finding) => total + findingImpact(finding), 0);
    const residualRisk = Math.max(0, 100 - resolvedScore);

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `sentinel-report-${resolvedTarget.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const htmlContent = buildReportHtml({
      target: resolvedTarget,
      score: resolvedScore,
      findings: resolvedFindings,
      meta,
      scoreLabel,
      scoreColor,
      scoreBg,
      totalCritical,
      totalHigh,
      totalMedium,
      totalLow,
      maxBar,
      totalFindings,
      totalRed,
      totalBlue,
      redShare,
      blueShare,
      scoreImpact,
      residualRisk,
      redWebFallback,
      redPort,
      blueWebFallback,
      bluePort,
    });

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    await browser.close();

    return filePath;
  }
}
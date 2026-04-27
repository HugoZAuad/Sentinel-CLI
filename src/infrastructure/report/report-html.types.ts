import { Finding, ScanMeta } from './report.types';

export interface ReportHtmlParams {
  target: string;
  score: number;
  findings: Finding[];
  meta?: ScanMeta;
  scoreLabel: string;
  scoreColor: string;
  scoreBg: string;
  totalCritical: number;
  totalHigh: number;
  totalMedium: number;
  totalLow: number;
  maxBar: number;
  totalFindings: number;
  totalRed: number;
  totalBlue: number;
  redShare: number;
  blueShare: number;
  scoreImpact: number;
  residualRisk: number;
  redWebFallback: Finding[];
  redPort: Finding[];
  blueWebFallback: Finding[];
  bluePort: Finding[];
}
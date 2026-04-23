import { Injectable } from '@nestjs/common';
import {
  VULN_SEVERITY,
  SEVERITY_WEIGHT,
  CONFIDENCE_WEIGHT,
} from './security-score.config';

interface Finding {
  type: string;
  confidence: 'low' | 'medium' | 'high';
}

@Injectable()
export class SecurityScoreService {
  calculate(findings: Finding[]) {
    if (!findings.length) {
      return this.buildResult(100, []);
    }

    let totalRisk = 0;

    const breakdown: any[] = [];

    for (const f of findings) {
      const severity = VULN_SEVERITY[f.type] ?? 'low';

      const base = SEVERITY_WEIGHT[severity];
      const confidence = CONFIDENCE_WEIGHT[f.confidence];

      const risk = base * confidence;

      totalRisk += risk;

      breakdown.push({
        type: f.type,
        severity,
        confidence: f.confidence,
        risk,
      });
    }

    const score = this.normalize(totalRisk);

    return this.buildResult(score, breakdown);
  }

  private normalize(risk: number): number {
    const maxRisk = 100;

    const raw = 100 - risk;

    if (raw < 0) return 0;
    if (raw > 100) return 100;

    return Math.round(raw);
  }

  private buildResult(score: number, breakdown: any[]) {
    return {
      score,
      grade: this.getGrade(score),
      riskLevel: this.getRiskLevel(score),
      breakdown,
    };
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private getRiskLevel(score: number): string {
    if (score >= 85) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Critical';
  }
}
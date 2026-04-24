import { Injectable } from "@nestjs/common";
import type { VulnFinding } from "../../red/web/vuln/vuln-check.interface";
import { CONFIDENCE_WEIGHT, SEVERITY_WEIGHT } from "./score.constants";

@Injectable()
export class SecurityScoreService {
  
  calculate(vulnerabilities: VulnFinding[]) {
    let penaltyTotal = 0;

    vulnerabilities.forEach(v => {
      const severity = v.severity.toLowerCase() as keyof typeof SEVERITY_WEIGHT;
      const confidence = (v.confidence?.toLowerCase() || 'medium') as keyof typeof CONFIDENCE_WEIGHT;

      const baseWeight = SEVERITY_WEIGHT[severity] || 0;
      const weightMultiplier = CONFIDENCE_WEIGHT[confidence] || 0.8;

      penaltyTotal += baseWeight * weightMultiplier;
    });

    const finalScore = Math.max(0, 100 - penaltyTotal);

    return {
      value: Number(finalScore.toFixed(2)),
      grade: this.getGrade(finalScore),
      metrics: {
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: vulnerabilities.filter(v => v.severity.toUpperCase() === 'CRITICAL').length,
        highCount: vulnerabilities.filter(v => v.severity.toUpperCase() === 'HIGH').length
      }
    };
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
}
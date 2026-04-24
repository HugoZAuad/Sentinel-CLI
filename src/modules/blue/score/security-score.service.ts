import { Injectable } from "@nestjs/common";
import type { VulnFinding } from "../../red/web/vuln/vuln-check.interface";

@Injectable()
export class SecurityScoreService {
  calculate(vulnerabilities: VulnFinding[]): any {
    let score = 100;

    vulnerabilities.forEach(v => {
      if (v.severity === 'CRITICAL') score -= 30;
      if (v.severity === 'HIGH') score -= 20;
      if (v.severity === 'MEDIUM') score -= 10;
      if (v.severity === 'LOW') score -= 5;
    });

    return {
      value: Math.max(0, score),
      grade: this.getGrade(score)
    };
  }

  private getGrade(score: number): string {
    if (score > 80) return 'A';
    if (score > 60) return 'B';
    return 'C';
  }
}
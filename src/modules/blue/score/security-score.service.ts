import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { CveService } from '../../../shared/cve/cve.service';
import { AuthService } from '../web/auth/auth.service';
import { FingerprintService } from '../web/fingerprint/fingerprint.service';
import { WebAnalyzerService } from '../web/webanalyzer/web-analyzer.service';
import { SEVERITY_WEIGHT as BASE_SEVERITY_WEIGHT } from './score.constants';
import { Finding } from '../../../infrastructure/report/report.service';

export type ScoreSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoreDetail {
  aspect: string;
  status: string;
  passed: boolean;
  severity: ScoreSeverity;
}

export interface ScoreBreakdown {
  headers: number;
  auth: number;
  cves: number;
  findings: number;
}

export interface SecurityScoreResult {
  score: number;
  details: ScoreDetail[];
  findings: Finding[];
  scoreBreakdown: ScoreBreakdown;
  cveMetadata: {
    techsAnalyzed: number;
    cvesMatched: number;
  };
}

const SCORE_WEIGHT: Record<ScoreSeverity, number> = {
  LOW: 2,
  MEDIUM: 5,
  HIGH: 10,
  CRITICAL: 20,
};

const CATEGORY_WEIGHT: Record<string, Record<ScoreSeverity, number>> = {
  webscan: {
    LOW: 1,
    MEDIUM: 1.15,
    HIGH: 1.35,
    CRITICAL: 1.6,
  },
  portscan: {
    LOW: 0.2,
    MEDIUM: 0.35,
    HIGH: 0.55,
    CRITICAL: 0.75,
  },
  auth: {
    LOW: 1.15,
    MEDIUM: 1.35,
    HIGH: 1.7,
    CRITICAL: 2.1,
  },
  config: {
    LOW: 0.9,
    MEDIUM: 1.05,
    HIGH: 1.2,
    CRITICAL: 1.45,
  },
  exposure: {
    LOW: 1,
    MEDIUM: 1.1,
    HIGH: 1.3,
    CRITICAL: 1.55,
  },
  network: {
    LOW: 0.3,
    MEDIUM: 0.45,
    HIGH: 0.65,
    CRITICAL: 0.9,
  },
};

@Injectable()
export class SecurityScoreService {
  constructor(
    private readonly logger: LoggerService,
    private readonly fingerprint: FingerprintService,
    private readonly auth: AuthService,
    private readonly webAnalyzer: WebAnalyzerService,
    private readonly cveService: CveService,
  ) {}

  async calculateGlobalScore(
    url: string,
    externalFindings: Finding[] = [],
  ): Promise<SecurityScoreResult> {
    try {
      this.logger.startTask(`Calculando Security Score: ${url}`);

      const [techs, authAudit, headerAudit] = await Promise.all([
        this.fingerprint.identify(url),
        this.auth.auditAuthentication(url),
        this.webAnalyzer.analyzeHeaders(url),
      ]);

      let score = 100;
      const details: ScoreDetail[] = [];
      const findings: any[] = [];
      const scoreBreakdown: ScoreBreakdown = {
        headers: 0,
        auth: 0,
        cves: 0,
        findings: 0,
      };
      const cveMetadata = {
        techsAnalyzed: 0,
        cvesMatched: 0,
      };

      const applyPenalty = (bucket: keyof ScoreBreakdown, amount: number) => {
        score -= amount;
        scoreBreakdown[bucket] -= amount;
      };

      const applyFindingPenalty = (finding: Finding) => {
        const severity = finding.severity;
        const category = finding.category ?? 'webscan';
        const categoryWeight = CATEGORY_WEIGHT[category]?.[severity] ?? 1;
        const amount = Math.max(1, Math.round(severityWeight(severity) * categoryWeight));

        applyPenalty('findings', amount);
        findings.push(finding);
      };

      const severityWeight = (severity: ScoreSeverity): number => {
        const mapped: Record<ScoreSeverity, keyof typeof BASE_SEVERITY_WEIGHT> = {
          LOW: 'low',
          MEDIUM: 'medium',
          HIGH: 'high',
          CRITICAL: 'critical',
        };

        return BASE_SEVERITY_WEIGHT[mapped[severity]] ?? SCORE_WEIGHT[severity];
      };

      const normalizeSeverity = (cveSeverity: string | undefined, baseScore: number): ScoreSeverity => {
        const normalized = (cveSeverity || '').toUpperCase();
        if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH' || normalized === 'CRITICAL') {
          return normalized;
        }

        if (baseScore >= 9.0) return 'CRITICAL';
        if (baseScore >= 7.0) return 'HIGH';
        if (baseScore >= 4.0) return 'MEDIUM';
        return 'LOW';
      };

      // ── HTTP Security Headers ─────────────────────
      for (const h of headerAudit) {
        const passed = h.status === 'SECURE';
        const severity = passed ? 'LOW' : (h.severity as ScoreSeverity);

        details.push({
          aspect: h.header,
          status: passed ? `✔ ${h.finding}` : `✘ ${h.finding}`,
          passed,
          severity,
        });

        if (!passed) {
          applyPenalty('headers', severityWeight(severity));
          findings.push({
            type: h.header,
            evidence: h.finding,
            severity,
            team: 'BLUE',
            category: 'webscan',
          });
        }
      }

      // ── HTTPS ─────────────────────────────────────
      const hasHttps = authAudit.audit.hasHttps;
      details.push({
        aspect: 'HTTPS',
        status: hasHttps
          ? '✔ Conexão encriptada via TLS detectada.'
          : '✘ Site acessível via HTTP. Tráfego suscetível a interceptação (MitM).',
        passed: hasHttps,
        severity: hasHttps ? 'LOW' : 'CRITICAL',
      });
      if (!hasHttps) {
        applyPenalty('auth', severityWeight('CRITICAL'));
        findings.push({
          type: 'HTTPS',
          evidence: 'Site acessível via HTTP sem redirecionamento para HTTPS. Tráfego suscetível a interceptação (MitM).',
          severity: 'CRITICAL',
          team: 'BLUE',
          category: 'webscan',
        });
      }

      // ── CSRF ──────────────────────────────────────
      const hasCsrf = authAudit.audit.hasCsrfToken;
      details.push({
        aspect: 'CSRF Token',
        status: hasCsrf
          ? '✔ Token anti-CSRF presente nos formulários.'
          : '✘ Nenhum token CSRF identificado. Formulários vulneráveis a CSRF.',
        passed: hasCsrf,
        severity: hasCsrf ? 'LOW' : 'MEDIUM',
      });
      if (!hasCsrf) {
        applyPenalty('auth', severityWeight('MEDIUM'));
        findings.push({
          type: 'CSRF Token',
          evidence: 'Nenhum token CSRF identificado nos formulários da aplicação.',
          severity: 'MEDIUM',
          team: 'BLUE',
          category: 'webscan',
        });
      }

      // ── Cookie HttpOnly ───────────────────────────
      const httpOnly = authAudit.audit.cookieSecurity.httpOnly;
      details.push({
        aspect: 'Cookie HttpOnly',
        status: httpOnly
          ? '✔ Flag HttpOnly presente nos cookies de sessão.'
          : '✘ Cookies de sessão sem flag HttpOnly. Suscetíveis a roubo via XSS.',
        passed: httpOnly,
        severity: httpOnly ? 'LOW' : 'HIGH',
      });
      if (!httpOnly) {
        applyPenalty('auth', severityWeight('HIGH'));
        findings.push({
          type: 'Cookie HttpOnly',
          evidence: 'Cookies de sessão sem flag HttpOnly. Suscetíveis a roubo via XSS.',
          severity: 'HIGH',
          team: 'BLUE',
          category: 'webscan',
        });
      }

      // ── Cookie Secure ─────────────────────────────
      const cookieSecure = authAudit.audit.cookieSecurity.secure;
      details.push({
        aspect: 'Cookie Secure',
        status: cookieSecure
          ? '✔ Flag Secure presente nos cookies.'
          : '✘ Cookies sem flag Secure. Podem ser transmitidos via HTTP.',
        passed: cookieSecure,
        severity: cookieSecure ? 'LOW' : 'MEDIUM',
      });
      if (!cookieSecure) {
        applyPenalty('auth', severityWeight('MEDIUM'));
        findings.push({
          type: 'Cookie Secure',
          evidence: 'Cookies sem flag Secure. Podem ser transmitidos em conexões não encriptadas.',
          severity: 'MEDIUM',
          team: 'BLUE',
          category: 'webscan',
        });
      }

      // ── CVE Lookup ────────────────────────────────
      const uniqueTechs = Array.from(new Map(techs.map((tech) => [tech.name.toLowerCase(), tech])).values());
      cveMetadata.techsAnalyzed = uniqueTechs.length;

      for (const tech of uniqueTechs) {
        const cves = await this.cveService.getVulnerabilitiesByKeyword(tech.name);

        if (cves.length > 0) {
          const topCves = cves.slice(0, 3);
          cveMetadata.cvesMatched += topCves.length;

          const worstSeverity = topCves.reduce<ScoreSeverity>((currentWorst, cve) => {
            const severity = normalizeSeverity(cve.severity, cve.baseScore);
            const rank: Record<ScoreSeverity, number> = {
              LOW: 0,
              MEDIUM: 1,
              HIGH: 2,
              CRITICAL: 3,
            };
            return rank[severity] > rank[currentWorst] ? severity : currentWorst;
          }, 'LOW');

          applyPenalty('cves', severityWeight(worstSeverity));

          details.push({
            aspect: `CVE — ${tech.name}`,
            status: `✘ ${topCves.map((cve) => cve.cveId).join(', ')} — ${topCves[0].description.substring(0, 80)}...`,
            passed: false,
            severity: worstSeverity,
          });

          findings.push({
            type: `CVE (${tech.name})`,
            evidence: `Tecnologia detectada: ${tech.name}. CVEs encontradas: ${topCves.map((cve) => cve.cveId).join(', ')}.`,
            severity: worstSeverity,
            team: 'RED',
            category: 'webscan',
          });
        } else {
          details.push({
            aspect: `CVE — ${tech.name}`,
            status: '✔ Nenhuma CVE crítica identificada para a tecnologia detectada.',
            passed: true,
            severity: 'LOW',
          });
        }
      }

      for (const finding of externalFindings) {
        applyFindingPenalty(finding);

        details.push({
          aspect: finding.type,
          status: `✘ ${finding.evidence}`,
          passed: false,
          severity: finding.severity,
        });
      }

      this.logger.stopTask(`Score calculado: ${Math.max(0, score)}/100`);

      return {
        score: Math.max(0, score),
        details,
        findings,
        scoreBreakdown,
        cveMetadata,
      };
    } catch (error) {
      this.logger.stopTask('Erro no cálculo do score', 'error');
      this.logger.error('Erro no SecurityScoreService', error);
      return {
        score: 0,
        details: [],
        findings: [],
        scoreBreakdown: {
          headers: 0,
          auth: 0,
          cves: 0,
          findings: 0,
        },
        cveMetadata: {
          techsAnalyzed: 0,
          cvesMatched: 0,
        },
      };
    }
  }
}
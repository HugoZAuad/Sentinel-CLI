import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { CveService } from '../../../shared/cve/cve.service';
import { AuthService } from '../web/auth/auth.service';
import { FingerprintService } from '../web/fingerprint/fingerprint.service';
import { WebAnalyzerService } from '../web/webanalyzer/web-analyzer.service';

export type ScoreSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoreDetail {
  aspect: string;
  status: string;
  passed: boolean;
  severity: ScoreSeverity;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  LOW: 2,
  MEDIUM: 5,
  HIGH: 10,
  CRITICAL: 20,
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
  ): Promise<{ score: number; details: ScoreDetail[]; findings: any[] }> {
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
          score -= SEVERITY_WEIGHT[severity] ?? 5;
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
        score -= SEVERITY_WEIGHT['CRITICAL'];
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
        score -= SEVERITY_WEIGHT['MEDIUM'];
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
        score -= SEVERITY_WEIGHT['HIGH'];
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
        score -= SEVERITY_WEIGHT['MEDIUM'];
        findings.push({
          type: 'Cookie Secure',
          evidence: 'Cookies sem flag Secure. Podem ser transmitidos em conexões não encriptadas.',
          severity: 'MEDIUM',
          team: 'BLUE',
          category: 'webscan',
        });
      }

      // ── CVE Lookup ────────────────────────────────
      if (techs.length > 0) {
        const mainTech = techs[0];
        const cves = await this.cveService.getVulnerabilitiesByKeyword(mainTech.name);

        if (cves.length > 0) {
          const topCve = cves[0];
          const cveSeverity = (topCve.severity?.toUpperCase() as ScoreSeverity) ?? 'HIGH';
          score -= SEVERITY_WEIGHT[cveSeverity] ?? 10;

          details.push({
            aspect: `CVE — ${mainTech.name}`,
            status: `✘ ${topCve.cveId} (Score: ${topCve.baseScore}) — ${topCve.description.substring(0, 80)}...`,
            passed: false,
            severity: cveSeverity,
          });

          findings.push({
            type: `CVE (${topCve.cveId})`,
            evidence: `Tecnologia detectada: ${mainTech.name}. ${topCve.description.substring(0, 120)}...`,
            severity: cveSeverity,
            team: 'RED',
            category: 'webscan',
          });
        } else {
          details.push({
            aspect: `CVE — ${mainTech.name}`,
            status: '✔ Nenhuma CVE crítica identificada para a tecnologia detectada.',
            passed: true,
            severity: 'LOW',
          });
        }
      }

      this.logger.stopTask(`Score calculado: ${Math.max(0, score)}/100`);

      return { score: Math.max(0, score), details, findings };
    } catch (error) {
      this.logger.stopTask('Erro no cálculo do score', 'error');
      this.logger.error('Erro no SecurityScoreService', error);
      return { score: 0, details: [], findings: [] };
    }
  }
}
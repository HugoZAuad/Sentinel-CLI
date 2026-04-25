import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { AuthService } from '../web/auth/auth.service';
import { FingerprintService } from '../web/fingerprint/fingerprint.service';

@Injectable()
export class SecurityScoreService {
  constructor(
    private readonly logger: LoggerService,
    private readonly fingerprint: FingerprintService,
    private readonly auth: AuthService,
  ) {}

  async calculateGlobalScore(url: string): Promise<{ score: number; details: any[] }> {
    try {
      this.logger.info(`Iniciando auditoria completa para score: ${url}`);

      const [techs, authAudit] = await Promise.all([
        this.fingerprint.identify(url),
        this.auth.auditAuthentication(url)
      ]);

      let score = 100;
      const details: any[] = [];

      const securityHeaders = techs.filter(t => t.category === 'Security' && t.isRisk);
      const serverExposure = techs.filter(t => t.category === 'Server' && t.isRisk);

      if (securityHeaders.length > 0) {
        score -= (securityHeaders.length * 10);
        details.push({ 
          aspect: 'Headers de Segurança', 
          status: `Faltam ${securityHeaders.length} headers críticos` 
        });
      } else {
        details.push({ aspect: 'Headers de Segurança', status: 'Protegido' });
      }

      if (serverExposure.length > 0) {
        score -= 5;
        details.push({ aspect: 'Exposição de Servidor', status: 'Versão Exposta' });
      }

      if (!authAudit.audit.hasHttps) {
        score -= 30;
        details.push({ aspect: 'Transporte (HTTPS)', status: 'Inseguro' });
      } else {
        details.push({ aspect: 'Transporte (HTTPS)', status: 'Seguro' });
      }

      if (!authAudit.audit.hasCsrfToken) {
        score -= 15;
        details.push({ aspect: 'Proteção CSRF', status: 'Ausente' });
      }

      if (!authAudit.audit.cookieSecurity.httpOnly) {
        score -= 10;
        details.push({ aspect: 'Segurança de Sessão', status: 'Cookies Vulneráveis' });
      }

      const finalScore = Math.max(0, score);

      return { score: finalScore, details };

    } catch (error) {
      this.logger.error('Erro ao calcular score de segurança', error);
      return { score: 0, details: [{ aspect: 'Erro', status: 'Falha na auditoria' }] };
    }
  }
}
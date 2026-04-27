import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface SecurityHeaderResult {
  header: string;
  status: 'SECURE' | 'VULNERABLE';
  finding: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class WebAnalyzerService {
  private readonly criticalHeaders = [
    { name: 'Strict-Transport-Security', severity: 'MEDIUM', desc: 'HSTS ausente.' },
    { name: 'Content-Security-Policy', severity: 'HIGH', desc: 'CSP ausente.' },
    { name: 'X-Frame-Options', severity: 'MEDIUM', desc: 'Proteção contra Clickjacking ausente.' },
    { name: 'X-Content-Type-Options', severity: 'LOW', desc: 'MIME Sniffing ativo.' },
    { name: 'Referrer-Policy', severity: 'LOW', desc: 'Política de Referrer não definida.' }
  ];

  async analyzeHeaders(target: string): Promise<SecurityHeaderResult[]> {
    const results: SecurityHeaderResult[] = [];
    try {
      const url = target.startsWith('http') ? target : `https://${target}`;
      const response = await axios.get(url, { 
        timeout: 8000,
        validateStatus: () => true 
      });

      const headers = response.headers;

      const asSeverity = (severity: string): SecurityHeaderResult['severity'] => {
        if (severity === 'LOW' || severity === 'MEDIUM' || severity === 'HIGH') {
          return severity;
        }
        return 'LOW';
      };

      for (const check of this.criticalHeaders) {
        const headerValue = headers[check.name.toLowerCase()];

        if (!headerValue) {
          results.push({
            header: check.name,
            status: 'VULNERABLE',
            finding: check.desc,
            severity: asSeverity(check.severity),
          });
        } else {
          const headerText = String(headerValue).substring(0, 80);
          const qualityIssue =
            check.name === 'Strict-Transport-Security' && !/max-age=\d+/i.test(headerText)
              ? ' (max-age ausente ou invalido)'
              : check.name === 'Content-Security-Policy' && !/default-src/i.test(headerText)
                ? ' (policy fraca/ausente de default-src)'
                : '';

          results.push({
            header: check.name,
            status: 'SECURE',
            finding: `Configurado: ${headerText}${qualityIssue}`,
            severity: 'LOW',
          });
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro de rede: ${error.message}`);
      }
      throw new Error('Erro na análise de headers.');
    }
    return results;
  }
}
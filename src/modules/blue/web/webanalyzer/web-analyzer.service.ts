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

      for (const check of this.criticalHeaders) {
        const headerValue = headers[check.name.toLowerCase()];

        if (!headerValue) {
          results.push({
            header: check.name,
            status: 'VULNERABLE',
            finding: check.desc,
            severity: check.severity as any,
          });
        } else {
          results.push({
            header: check.name,
            status: 'SECURE',
            finding: `Configurado: ${String(headerValue).substring(0, 40)}`,
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
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserService } from '../../core/browser/browser.service';

@Injectable()
export class ReportService {
  constructor(private readonly browserService: BrowserService) {}

  async generatePdf(scan: any, fileName: string): Promise<string> {
    const page = await this.browserService.newPage();
    try {
      const html = this.compileTemplate(scan);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const reportsDir = path.resolve(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      const filePath = path.join(reportsDir, `${fileName}.pdf`);
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
      });

      return filePath;
    } finally {
      await page.close();
    }
  }

  private compileTemplate(scan: any): string {
    const redFindings = scan.findings.filter(f => f.team === 'RED');
    const blueFindings = scan.findings.filter(f => f.team === 'BLUE');
    const date = new Date(scan.createdAt || Date.now()).toLocaleDateString('pt-BR');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <style>
          :root {
            --primary: #0f172a;
            --secondary: #334155;
            --accent: #3b82f6;
            --danger: #ef4444;
            --success: #10b981;
            --warning: #f59e0b;
            --gray-light: #f8fafc;
            --border: #e2e8f0;
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: var(--primary); 
            margin: 0;
            padding: 0;
          }

          .header { 
            background-color: var(--primary); 
            color: white; 
            padding: 40px; 
            text-align: center;
            border-radius: 0 0 20px 20px;
          }

          .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
          .header p { margin: 10px 0 0; opacity: 0.8; }

          .container { padding: 30px; }

          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }

          .card {
            background: var(--gray-light);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border);
          }

          .score-big {
            font-size: 54px;
            font-weight: bold;
            color: var(--accent);
            text-align: center;
            display: block;
          }

          h2 { 
            border-left: 5px solid var(--accent); 
            padding-left: 15px; 
            color: var(--primary);
            font-size: 20px;
            margin-top: 40px;
            text-transform: uppercase;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            background: white;
          }

          th { 
            background: var(--secondary); 
            color: white; 
            text-align: left; 
            padding: 12px; 
            font-size: 14px;
          }

          td { 
            padding: 12px; 
            border: 1px solid var(--border); 
            font-size: 13px; 
          }

          .severity-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
          }

          .critical { background: #fee2e2; color: #991b1b; }
          .high { background: #ffedd5; color: #9a3412; }
          .medium { background: #fef9c3; color: #854d0e; }
          .low { background: #dcfce7; color: #166534; }

          .footer {
            margin-top: 50px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid var(--border);
            padding-top: 20px;
          }

          .empty-state {
            padding: 20px;
            text-align: center;
            background: #f1f5f9;
            color: #64748b;
            border-radius: 8px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SENTINEL SECURITY AUDIT</h1>
          <p>Relatório Gerado em: ${date}</p>
        </div>

        <div class="container">
          <div class="summary-grid">
            <div class="card">
              <strong>ALVO DA ANÁLISE</strong><br>
              <span style="color: var(--accent)">${scan.target}</span><br><br>
              <strong>STATUS GLOBAL</strong><br>
              <span>${scan.score > 70 ? 'CONFORME' : 'RISCO DETECTADO'}</span>
            </div>
            <div class="card">
              <strong>SECURITY SCORE</strong>
              <span class="score-big">${scan.score}/100</span>
            </div>
          </div>

          <h2>1. METODOLOGIA</h2>
          <p style="font-size: 13px;">
            A análise foi realizada seguindo padrões OWASP Top 10 e verificações de infraestrutura defensiva. 
            O processo engloba Port Scanning, Web Application Vulnerability Scanning (DAST) e Auditoria de Cabeçalhos de Segurança.
          </p>

          <h2>2. ANÁLISE OFENSIVA (RED TEAM)</h2>
          <p style="font-size: 12px; color: #64748b;">Testes executados: Injeção de SQL (SQLi), Cross-Site Scripting (XSS), Varredura de Portas e Serviços.</p>
          
          ${redFindings.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>VULNERABILIDADE / TESTE</th>
                  <th>EVIDÊNCIA ENCONTRADA</th>
                  <th>SEVERIDADE</th>
                </tr>
              </thead>
              <tbody>
                ${redFindings.map(f => `
                  <tr>
                    <td>${f.type}</td>
                    <td><code>${f.evidence}</code></td>
                    <td><span class="severity-badge ${f.severity?.toLowerCase() || 'medium'}">${f.severity || 'MEDIUM'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              Nenhuma vulnerabilidade crítica foi detectada durante a execução dos testes ofensivos automatizados.
            </div>
          `}

          <h2>3. AUDITORIA DEFENSIVA (BLUE TEAM)</h2>
          <p style="font-size: 12px; color: #64748b;">Análise de conformidade: Certificados SSL/TLS, Políticas de Cookies e Cabeçalhos de Proteção.</p>
          
          ${blueFindings.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>CONTROLE DE SEGURANÇA</th>
                  <th>STATUS DO DIAGNÓSTICO</th>
                  <th>SEVERIDADE</th>
                </tr>
              </thead>
              <tbody>
                ${blueFindings.map(f => `
                  <tr>
                    <td>${f.type}</td>
                    <td>${f.evidence}</td>
                    <td><span class="severity-badge ${f.severity?.toLowerCase() || 'low'}">${f.severity || 'LOW'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="empty-state">
              Todos os controles defensivos básicos foram validados e estão operando conforme as melhores práticas.
            </div>
          `}

          <div class="footer">
            Sentinel CLI v1.0.0 - Ferramenta de Auditoria Modular Automatizada<br>
            Este documento é confidencial e destinado exclusivamente ao proprietário do sistema analisado.
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
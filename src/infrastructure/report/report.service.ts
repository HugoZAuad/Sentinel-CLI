import { Injectable } from '@nestjs/common';
import { BrowserService } from '../../core/browser/browser.service';
import { LoggerService } from '../logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  constructor(
    private readonly browserService: BrowserService,
    private readonly logger: LoggerService
  ) {}

  async generatePdf(data: any, fileName: string): Promise<string> {
    const page = await this.browserService.newPage();
    
    try {
      this.logger.log(`Gerando relatório PDF: ${fileName}.pdf`);
      const htmlContent = this.getHtmlTemplate(data);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const reportsDir = path.resolve(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

      const filePath = path.join(reportsDir, `${fileName}.pdf`);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size: 8px; width: 100%; text-align: center; color: #94a3b8; font-family: sans-serif;">
            Sentinel Security Framework - Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>`,
      });

      return filePath;
    } catch (error) {
      this.logger.error('Falha ao gerar PDF', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private getHtmlTemplate(data: any): string {
    const date = new Date().toLocaleString('pt-BR');

    const styles = `
      :root { --red: #ef4444; --blue: #3b82f6; --dark: #0f172a; --gray: #64748b; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 0; }
      .header { border-bottom: 3px solid var(--red); padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
      .header h1 { color: var(--red); margin: 0; font-size: 28px; letter-spacing: -1px; }
      .header p { color: var(--gray); font-size: 12px; margin: 5px 0 0 0; }
      
      .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
      .score-box { font-size: 48px; font-weight: bold; color: ${data.score < 70 ? 'var(--red)' : 'var(--blue)'}; }
      
      .section { margin-bottom: 40px; }
      .section-title { font-size: 18px; font-weight: bold; color: var(--dark); border-left: 4px solid var(--red); padding-left: 12px; margin-bottom: 20px; text-transform: uppercase; }
      
      table { width: 100%; border-collapse: collapse; }
      th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; color: var(--gray); text-transform: uppercase; }
      td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      
      .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
      .badge-red { background: #fee2e2; color: #991b1b; }
      .badge-green { background: #dcfce7; color: #166534; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="header">
          <div>
            <h1>SENTINEL SECURITY REPORT</h1>
            <p>Enterprise Vulnerability & Compliance Audit</p>
          </div>
          <div style="text-align: right">
            <p>Gerado em: ${date}</p>
            <p>Versão CLI: 1.2.0</p>
          </div>
        </div>

        <div class="summary-card">
          <table style="border: none;">
            <tr>
              <td style="border: none; width: 70%;">
                <h3 style="margin: 0">Alvo da Análise</h3>
                <p style="font-size: 18px; color: var(--blue); margin: 5px 0;">${data.target}</p>
              </td>
              <td style="border: none; text-align: center;">
                <div style="font-size: 12px; color: var(--gray)">SECURITY SCORE</div>
                <div class="score-box">${data.score}</div>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Resultados de Vulnerabilidade (Red Team)</div>
          <table>
            <thead>
              <tr><th>Tipo</th><th>Evidência / Localização</th><th>Risco</th></tr>
            </thead>
            <tbody>
              ${data.redFindings.map(f => `
                <tr>
                  <td><b>${f.type}</b></td>
                  <td style="font-family: monospace; font-size: 11px;">${f.evidence}</td>
                  <td><span class="badge badge-red">CRÍTICO</span></td>
                </tr>
              `).join('') || '<tr><td colspan="3">Nenhuma vulnerabilidade crítica detectada.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Auditoria de Conformidade (Blue Team)</div>
          <table>
            <thead>
              <tr><th>Aspecto</th><th>Status Detectado</th><th>Impacto</th></tr>
            </thead>
            <tbody>
              ${data.blueDetails.map(d => `
                <tr>
                  <td>${d.aspect}</td>
                  <td>${d.status}</td>
                  <td><span class="badge ${d.status.includes('OK') || d.status.includes('Protegido') ? 'badge-green' : 'badge-red'}">
                    ${d.status.includes('OK') || d.status.includes('Protegido') ? 'BAIXO' : 'ALTO'}
                  </span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 50px; padding: 20px; background: #fff7ed; border-radius: 8px; font-size: 11px; color: #9a3412;">
          <b>Nota de Isenção:</b> Este relatório foi gerado automaticamente pelo Sentinel CLI. 
          A ausência de descobertas não garante que o sistema esteja invulnerável. Recomenda-se revisões manuais periódicas.
        </div>
      </body>
      </html>
    `;
  }
}
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserService } from '../../core/browser/browser.service';

@Injectable()
export class ReportService {
  constructor(private readonly browserService: BrowserService) {}

  async generatePdf(scanData: any, fileName: string, reportType: 'FULL' | 'NETWORK' = 'FULL'): Promise<string> {
    const page = await this.browserService.newPage();
    try {
      const html = this.compileTemplate(scanData, reportType);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const reportsDir = path.resolve(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      const filePath = path.join(reportsDir, `${fileName}.pdf`);
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
      });

      return filePath;
    } finally {
      await page.close();
    }
  }

  private compileTemplate(scan: any, type: 'FULL' | 'NETWORK'): string {
    const date = new Date(scan.createdAt || Date.now()).toLocaleString('pt-BR');
    const isNetwork = type === 'NETWORK';
    
    let bodyContent = '';

    if (isNetwork) {
      const ports = scan.ports || [];
      bodyContent = `
        <div class="section-title">📊 Visão Geral da Rede</div>
        <div class="summary-grid">
          <div class="card">
            <label>HOST ALVO</label>
            <div class="value">${scan.target}</div>
          </div>
          <div class="card">
            <label>VARREDURA</label>
            <div class="value">${scan.startPort} — ${scan.endPort}</div>
          </div>
        </div>

        <div class="section-title">🔍 Portas Identificadas</div>
        ${ports.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 80px">PORTA</th>
                <th style="width: 150px">SERVIÇO</th>
                <th>BANNER / EVIDÊNCIA TÉCNICA</th>
              </tr>
            </thead>
            <tbody>
              ${ports.map((p: any) => `
                <tr>
                  <td><span class="port-badge">${p.port}</span></td>
                  <td class="service-name">${p.service}</td>
                  <td><code class="evidence-code">${p.banner || 'No banner grab'}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">⚠️ Nenhuma porta aberta foi detectada no perímetro analisado.</div>
        `}
      `;
    } else {
      const redFindings = scan.findings?.filter((f: any) => f.team === 'RED') || [];
      const blueFindings = scan.findings?.filter((f: any) => f.team === 'BLUE') || [];
      const scoreColor = scan.score > 70 ? '#10b981' : scan.score > 40 ? '#f59e0b' : '#ef4444';

      bodyContent = `
        <div class="section-title">🛡️ Postura de Segurança</div>
        <div class="summary-grid">
          <div class="card">
            <label>ALVO DA AUDITORIA</label>
            <div class="value">${scan.target}</div>
            <div class="status-pill ${scan.score > 70 ? 'success' : 'danger'}">
              ${scan.score > 70 ? '● SISTEMA SEGURO' : '● VULNERABILIDADE DETECTADA'}
            </div>
          </div>
          <div class="card" style="text-align: center">
            <label>SCORE DE SEGURANÇA</label>
            <div class="score-container">
               <div class="score-value" style="color: ${scoreColor}">${scan.score}<span>/100</span></div>
               <div class="score-bar-bg"><div class="score-bar-fill" style="width: ${scan.score}%; background: ${scoreColor}"></div></div>
            </div>
          </div>
        </div>

        <div class="section-title">🔴 Vulnerabilidades (Red Team)</div>
        ${redFindings.length > 0 ? `
          <table>
            <thead><tr><th>TIPO</th><th>EVIDÊNCIA</th><th style="width: 100px">RISCO</th></tr></thead>
            <tbody>
              ${redFindings.map((f: any) => `
                <tr>
                  <td style="font-weight: 600">${f.type}</td>
                  <td><code class="evidence-code">${f.evidence}</code></td>
                  <td><span class="severity-badge ${f.severity?.toLowerCase()}">${f.severity}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="empty-state">✅ Nenhuma vulnerabilidade ofensiva encontrada.</div>`}

        <div class="section-title">🔵 Controles Defensivos (Blue Team)</div>
        ${blueFindings.length > 0 ? `
          <table>
            <thead><tr><th>CONTROLE ANALISADO</th><th>OBSERVAÇÃO</th><th style="width: 100px">STATUS</th></tr></thead>
            <tbody>
              ${blueFindings.map((f: any) => `
                <tr>
                  <td style="font-weight: 600">${f.type}</td>
                  <td>${f.evidence}</td>
                  <td><span class="severity-badge ${f.severity?.toLowerCase() === 'low' ? 'success-badge' : 'warning-badge'}">${f.severity === 'LOW' ? 'SEGURO' : 'AVISO'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `<div class="empty-state">ℹ️ Nenhum controle defensivo foi registrado.</div>`}
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap');
          
          :root {
            --bg: #ffffff;
            --sidebar: #0f172a;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --accent: #3b82f6;
            --border: #e2e8f0;
            --danger: #ef4444;
            --success: #10b981;
            --warning: #f59e0b;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; padding: 0; 
            color: var(--text-main);
            background-color: var(--bg);
          }

          .header { 
            background: var(--sidebar); 
            color: white; 
            padding: 40px 30px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
          }

          .header-title h1 { margin: 0; font-size: 22px; letter-spacing: -0.5px; font-weight: 700; }
          .header-title p { margin: 5px 0 0; font-size: 12px; opacity: 0.6; text-transform: uppercase; }
          .header-meta { text-align: right; font-size: 12px; }

          .container { padding: 40px; }

          .section-title { 
            font-size: 14px; 
            font-weight: 700; 
            color: var(--text-muted); 
            text-transform: uppercase; 
            margin-bottom: 15px;
            margin-top: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .summary-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
          
          .card { 
            border: 1px solid var(--border); 
            padding: 20px; 
            border-radius: 12px; 
            background: #f8fafc;
          }

          .card label { font-size: 10px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 8px; }
          .card .value { font-size: 18px; font-weight: 700; color: var(--sidebar); }

          .status-pill { 
            display: inline-block; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-size: 10px; 
            font-weight: 700; 
            margin-top: 12px; 
          }
          .status-pill.success { background: #dcfce7; color: #15803d; }
          .status-pill.danger { background: #fee2e2; color: #b91c1c; }

          .score-container { padding: 10px 0; }
          .score-value { font-size: 42px; font-weight: 700; margin-bottom: 5px; }
          .score-value span { font-size: 16px; opacity: 0.5; }
          .score-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
          .score-bar-fill { height: 100%; border-radius: 10px; transition: width 1s ease; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
          th { background: #f1f5f9; padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
          td { padding: 14px 15px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: top; }

          .port-badge { background: var(--sidebar); color: white; padding: 4px 8px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
          .service-name { font-weight: 700; color: var(--accent); }
          
          .evidence-code { 
            font-family: 'JetBrains Mono', monospace; 
            font-size: 11px; 
            background: #f1f5f9; 
            padding: 4px 8px; 
            border-radius: 4px; 
            display: block;
            white-space: pre-wrap;
            word-break: break-all;
          }

          .severity-badge { 
            padding: 4px 8px; 
            border-radius: 6px; 
            font-size: 10px; 
            font-weight: 700; 
            text-transform: uppercase;
            display: inline-block;
          }
          .critical { background: #7f1d1d; color: white; }
          .high { background: #ef4444; color: white; }
          .medium { background: #f59e0b; color: white; }
          .low { background: #10b981; color: white; }
          .success-badge { background: #dcfce7; color: #15803d; }
          .warning-badge { background: #fef9c3; color: #854d0e; }

          .empty-state { padding: 30px; text-align: center; color: var(--text-muted); background: #f8fafc; border: 2px dashed var(--border); border-radius: 12px; margin-top: 20px; }

          .footer { margin-top: 50px; border-top: 1px solid var(--border); padding-top: 20px; font-size: 10px; color: var(--text-muted); text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">
            <h1>SENTINEL<span>SCAN</span></h1>
            <p>Cybersecurity Intelligence System</p>
          </div>
          <div class="header-meta">
            <strong>DATA DO RELATÓRIO</strong><br>
            ${date}<br>
            <span style="color: var(--accent)">ID: ${scan.id.substring(0, 8)}</span>
          </div>
        </div>

        <div class="container">
          ${bodyContent}
          
          <div class="footer">
            Este documento é confidencial e destinado apenas para fins de auditoria de segurança. <br>
            Gerado automaticamente pelo <strong>Sentinel-CLI</strong>.
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
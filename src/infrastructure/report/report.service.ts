import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { WebScanResult } from '../../modules/web/webscan/webscan.types';

@Injectable()
export class ReportService {
  generateMarkdown(result: WebScanResult): string {
    const date = new Date().toLocaleString();
    
    let md = `# Sentinel Scan Report - ${result.url}\n\n`;
    md += `> **Data do Scan:** ${date}\n`;
    md += `> **Duração:** ${result.time}\n`;
    md += `> **Score de Segurança:** ${this.getScoreBadge(result.score.value)} (${result.score.value}/100)\n\n`;

    md += `## 🛡️ Tecnologias Detectadas\n`;
    if (result.tech.length > 0) {
      result.tech.forEach(t => md += `- ${t}\n`);
    } else {
      md += `*Nenhuma tecnologia específica identificada.*\n`;
    }
    md += `\n`;

    md += `## 🔍 Resumo da Superfície\n`;
    md += `- **Status HTTP:** ${result.status}\n`;
    md += `- **Endpoints Descobertos:** ${result.endpoints.length}\n`;
    md += `- **Links Mapeados:** ${result.links.length}\n`;
    md += `- **Formulários Encontrados:** ${result.forms.length}\n\n`;

    md += `## 🚨 Vulnerabilidades Encontradas\n\n`;
    if (result.vulnerabilities.length === 0) {
      md += `✅ **Nenhuma vulnerabilidade crítica detectada.**\n\n`;
    } else {
      md += `| Severidade | Tipo | Alvo | Parâmetro | Confiança |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      
      result.vulnerabilities.forEach(v => {
        md += `| ${this.getSeverityEmoji(v.severity)} ${v.severity} | ${v.type} | \`${v.target}\` | \`${v.param || 'N/A'}\` | ${v.confidence} |\n`;
      });
      md += `\n`;
    }

    md += `## 📝 Detalhes das Evidências\n`;
    result.vulnerabilities.forEach((v, index) => {
      md += `### ${index + 1}. ${v.type}\n`;
      md += `- **Payload utilizado:** \`${v.payload}\`\n`;
      md += `- **Evidência:** ${v.evidence}\n\n`;
    });

    return md;
  }

  async saveToFile(content: string, targetPath: string = 'reports'): Promise<string> {
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath);
    const fileName = `scan_${Date.now()}.md`;
    const fullPath = path.join(targetPath, fileName);
    fs.writeFileSync(fullPath, content);
    return fullPath;
  }

  private getSeverityEmoji(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🔵'
    };
    return map[severity] || '⚪';
  }

  private getScoreBadge(score: number): string {
    if (score > 80) return '🟢 EXCELENTE';
    if (score > 50) return '🟡 ATENÇÃO';
    return '🔴 CRÍTICO';
  }
}
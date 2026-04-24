import { Injectable } from '@nestjs/common';
import { DomXssService } from '../../../../core/browser/dom-xss.service';
import { InteractionService } from '../../../../core/browser/interaction.service';
import { FormatterService } from '../../../../core/formatter/formatter.service';
import { LoggerService } from '../../../../infrastructure/logger/logger.service';
import { ReportService } from '../../../../infrastructure/report/report.service';

@Injectable()
export class WebscanService {
  constructor(
    private readonly logger: LoggerService,
    private readonly report: ReportService,
    private readonly formatter: FormatterService,
    private readonly interaction: InteractionService,
    private readonly domXss: DomXssService,
  ) {}

  async execute(targetUrl: string): Promise<void> {
    this.logger.log(`Iniciando análise completa em: ${targetUrl}`);
    
    try {
      this.logger.startTask('Explorando estrutura e interações da página...');
      const urls = await this.interaction.explore(targetUrl);
      this.logger.stopTask(`Descobertos ${urls.length} links/pontos de interação.`, 'success');

      this.logger.startTask('Executando scan ativo de DOM XSS...');
      const allFindings: any[] = [];

      for (const url of urls) {
        if (url.includes(new URL(targetUrl).hostname)) {
          const findings = await this.domXss.scan(url);
          allFindings.push(...findings);
        }
      }
      this.logger.stopTask('Varredura de vulnerabilidades concluída.', 'success');

      this.renderResults(allFindings);

      if (allFindings.length > 0) {
        const reportPath = this.report.save('webscan-results', {
          target: targetUrl,
          date: new Date(),
          findings: allFindings,
          urlsDiscovered: urls
        });
        this.logger.success(`Relatório detalhado gerado: ${reportPath}`);
      } else {
        this.logger.info('Nenhuma vulnerabilidade crítica encontrada nesta sessão.');
      }

    } catch (error) {
      this.logger.error('Erro crítico durante o Webscan', error);
    }
  }

  private renderResults(findings: any[]): void {
    if (findings.length === 0) return;

    const head = ['TIPO', 'URL ALVO', 'PAYLOAD / EVIDÊNCIA'];
    const rows = findings.map(f => [
      f.type,
      this.formatter.truncate(f.url, 30),
      this.formatter.truncate(f.payload || f.evidence, 40)
    ]);

    const table = this.formatter.formatTable(head, rows, 'red');
    
    console.log('\n' + table + '\n');
  }
}
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
      const targetHostname = new URL(targetUrl).hostname;

      this.logger.startTask('Explorando estrutura e interações da página...');
      const urls = await this.interaction.explore(targetUrl);
      const filteredUrls = urls.filter(u => u.includes(targetHostname));
      this.logger.stopTask(`Descobertos ${filteredUrls.length} links internos para análise.`, 'success');

      this.logger.startTask('Executando scan ativo de DOM XSS (Paralelo)...');
      const allFindings: any[] = [];
      const concurrencyLimit = 5;
      for (let i = 0; i < filteredUrls.length; i += concurrencyLimit) {
        const chunk = filteredUrls.slice(i, i + concurrencyLimit);
        
        const scanPromises = chunk.map(async (url) => {
          try {
            return await this.domXss.scan(url);
          } catch (e) {
            this.logger.info(`Falha ao escanear URL específica: ${this.formatter.truncate(url, 30)}`);
            return [];
          }
        });

        const results = await Promise.all(scanPromises);
        allFindings.push(...results.flat());
      }
      
      this.logger.stopTask('Varredura de vulnerabilidades concluída.', 'success');

      this.renderResults(allFindings);

      if (allFindings.length > 0) {
        const reportPath = this.report.save('webscan-results', {
          target: targetUrl,
          totalUrls: filteredUrls.length,
          findings: allFindings,
        });
        this.logger.success(`Relatório gerado: ${reportPath}`);
      } else {
        this.logger.info('Nenhuma vulnerabilidade detectada.');
      }

    } catch (error) {
      this.logger.error('Erro fatal no motor de Webscan', error);
    }
  }

  private renderResults(findings: any[]): void {
    if (findings.length === 0) return;

    const head = ['TIPO', 'URL ALVO', 'EVIDÊNCIA'];
    const rows = findings.map(f => [
      f.type,
      this.formatter.truncate(f.url, 35),
      this.formatter.truncate(f.payload || f.evidence, 45)
    ]);

    console.log('\n' + this.formatter.formatTable(head, rows, 'red') + '\n');
  }
}
import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { FormatterService } from '../core/formatter/formatter.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { SecurityScoreService } from '../modules/blue/score/security-score.service';
import { PortscanService } from '../modules/red/network/portscan/portscan.service';
import { WebscanService } from '../modules/red/web/webscan/webscan.service';

@Injectable()
export class CliService {
  private prompt = inquirer.createPromptModule();

  constructor(
    private readonly portscanService: PortscanService,
    private readonly webscanService: WebscanService,
    private readonly scoreService: SecurityScoreService,
    private readonly logger: LoggerService,
    private readonly formatter: FormatterService,
  ) {}

  async start(): Promise<void> {
    this.showBanner();
    while (true) {
      const { mode } = await this.prompt([{
        type: 'select',
        name: 'mode',
        message: 'Selecione o modo de operação:',
        choices: [
          { name: chalk.red('🔴 Red Team (Ofensivo)'), value: 'red' },
          { name: chalk.blue('🔵 Blue Team (Defensivo)'), value: 'blue' },
          { name: chalk.gray('🚪 Sair'), value: 'exit' },
        ],
      }]);

      if (mode === 'exit') {
        this.logger.log('Encerrando Sentinel.');
        process.exit(0);
      }

      mode === 'red' ? await this.handleRedTeam() : await this.handleBlueTeam();
    }
  }

  private showBanner() {
    console.clear();
    console.log(chalk.red(`
    ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
    ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
    ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
    ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
    ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
    ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
    `));
    this.logger.info('--- Enterprise Security Framework | v1.2.0 ---\n');
  }

  private async handleRedTeam() {
    const { tool } = await this.prompt([{
      type: 'select',
      name: 'tool',
      message: chalk.red('MODO OFENSIVO:'),
      choices: [
        { name: '🔍 Port Scanner', value: 'port' },
        { name: '🌐 Web Scanner', value: 'web' },
        { name: '⬅️ Voltar', value: 'back' },
      ],
    }]);

    if (tool === 'port') await this.runPortScan();
    if (tool === 'web') await this.runWebScan();
  }

  private async handleBlueTeam() {
    const { tool } = await this.prompt([{
      type: 'select',
      name: 'tool',
      message: chalk.blue('MODO DEFENSIVO:'),
      choices: [
        { name: '📊 Security Score', value: 'score' },
        { name: '⬅️ Voltar', value: 'back' },
      ],
    }]);

    if (tool === 'score') await this.runSecurityScore();
  }

  private async runPortScan() {
    const { host, range } = await this.prompt([
      { type: 'input', name: 'host', message: 'Target Host:', default: '127.0.0.1' },
      { type: 'input', name: 'range', message: 'Port Range (ex: 1-1024):', default: '1-1000' }
    ]);

    const [start, end] = range.split('-').map(Number);
    this.logger.startTask(`Escaneando portas em ${host}...`);
    const openPorts = await this.portscanService.scanRange(host, start, end);
    this.logger.stopTask('Scan de rede finalizado.');

    const head = ['PORTA', 'STATUS', 'SERVIÇO'];
    const rows = openPorts.map(p => [p.port, chalk.green('OPEN'), p.service]);
    console.log(this.formatter.formatTable(head, rows, 'red'));
  }

  private async runWebScan() {
    const { url } = await this.prompt([{ type: 'input', name: 'url', message: 'Target URL:' }]);
    await this.webscanService.execute(url);
  }

  private async runSecurityScore() {
    this.logger.startTask('Calculando Score de Segurança...');
    const result = await this.scoreService.calculateGlobalScore(); 
    this.logger.stopTask('Auditoria concluída.');

    this.logger.success(`Score Final: ${result.score}/100`);
    
    const head = ['ASPECTO', 'STATUS'];
    const rows = result.details.map(d => [d.aspect, d.status]);
    console.log(this.formatter.formatTable(head, rows, 'blue'));
  }
}
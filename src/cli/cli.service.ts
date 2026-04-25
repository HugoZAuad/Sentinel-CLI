import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { FormatterService } from '../core/formatter/formatter.service';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { ReportService } from '../infrastructure/report/report.service';
import { SecurityScoreService } from '../modules/blue/score/security-score.service';
import { AuthService } from '../modules/blue/web/auth/auth.service';
import { FingerprintService } from '../modules/blue/web/fingerprint/fingerprint.service';
import { PortscanService } from '../modules/red/network/portscan/portscan.service';
import { WebscanService } from '../modules/red/web/webscan/webscan.service';

@Injectable()
export class CliService {
  private prompt = inquirer.createPromptModule();
  private lastWebFindings: any[] = [];
  private lastTargetUrl: string = '';

  constructor(
    private readonly portscanService: PortscanService,
    private readonly webscanService: WebscanService,
    private readonly scoreService: SecurityScoreService,
    private readonly authService: AuthService,
    private readonly fingerprintService: FingerprintService,
    private readonly logger: LoggerService,
    private readonly formatter: FormatterService,
    private readonly reportService: ReportService,
  ) {}

  async start(): Promise<void> {
    this.showBanner();
    while (true) {
      const { mode } = await this.prompt([{
        type: 'select',
        name: 'mode',
        message: 'Selecione o modo de operação:',
        choices: [
          { name: chalk.red('🔴 Red Team'), value: 'red' },
          { name: chalk.blue('🔵 Blue Team'), value: 'blue' },
          { name: chalk.gray('🚪 Sair'), value: 'exit' },
        ],
      }]);

      if (mode === 'exit') process.exit(0);
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
        { name: '📊 Security Score & PDF', value: 'score' },
        { name: '🕵️  Fingerprint', value: 'finger' },
        { name: '🔑 Auth Audit', value: 'auth' },
        { name: '⬅️ Voltar', value: 'back' },
      ],
    }]);

    if (tool === 'score') await this.runSecurityScore();
    if (tool === 'finger') await this.runFingerprintScan();
    if (tool === 'auth') await this.runAuthAudit();
  }

  private async runPortScan() {
    const { host, range } = await this.prompt([
      { type: 'input', name: 'host', message: 'Host:', default: '127.0.0.1' },
      { type: 'input', name: 'range', message: 'Range:', default: '1-1000' }
    ]);
    const [start, end] = range.split('-').map(Number);
    const openPorts = await this.portscanService.scanRange(host, start, end);
    const head = ['PORTA', 'SERVIÇO', 'BANNER'];
    const rows = openPorts.map(p => [p.port, p.service, p.banner || 'N/A']);
    console.log(this.formatter.formatTable(head, rows, 'red'));
  }

  private async runWebScan() {
    const { url } = await this.prompt([{ type: 'input', name: 'url', message: 'URL:' }]);
    this.lastTargetUrl = url;
    this.lastWebFindings = await this.webscanService.execute(url);
  }

  private async runFingerprintScan() {
    const { url } = await this.prompt([{ type: 'input', name: 'url', message: 'URL:' }]);
    const techs = await this.fingerprintService.identify(url);
    const head = ['TECNOLOGIA', 'CATEGORIA', 'RISCO'];
    const rows = techs.map(t => [t.name, t.category, t.isRisk ? chalk.red('SIM') : chalk.green('NÃO')]);
    console.log(this.formatter.formatTable(head, rows, 'blue'));
  }

  private async runAuthAudit() {
    const { url } = await this.prompt([{ type: 'input', name: 'url', message: 'URL:' }]);
    const result = await this.authService.auditAuthentication(url);
    const head = ['MÉTRICA', 'STATUS'];
    const rows = [
      ['HTTPS', result.audit.hasHttps ? 'OK' : 'FALHA'],
      ['CSRF', result.audit.hasCsrfToken ? 'OK' : 'AUSENTE'],
      ['HttpOnly', result.audit.cookieSecurity.httpOnly ? 'OK' : 'RISCO'],
    ];
    console.log(this.formatter.formatTable(head, rows, 'blue'));
  }

  private async runSecurityScore() {
    const { url } = await this.prompt([{ 
      type: 'input', 
      name: 'url', 
      message: 'URL:', 
      default: this.lastTargetUrl 
    }]);

    const result = await this.scoreService.calculateGlobalScore(url);
    console.log(chalk.bold(`\nSCORE: ${result.score}/100\n`));
    
    const head = ['ASPECTO', 'STATUS'];
    const rows = result.details.map(d => [d.aspect, d.status]);
    console.log(this.formatter.formatTable(head, rows, 'blue'));

    const { confirmPdf } = await this.prompt([{
      type: 'confirm',
      name: 'confirmPdf',
      message: 'Gerar PDF?',
      default: true
    }]);

    if (confirmPdf) {
      const reportData = {
        target: url,
        score: result.score,
        redFindings: this.lastWebFindings.map(f => ({ type: f.type, evidence: f.evidence })),
        blueDetails: result.details
      };
      const path = await this.reportService.generatePdf(reportData, `report_${Date.now()}`);
      this.logger.success(`Salvo em: ${path}`);
    }
  }
}
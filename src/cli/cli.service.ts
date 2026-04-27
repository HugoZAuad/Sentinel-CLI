import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { FormatterService } from '../core/formatter/formatter.service';
import { ScanRepository } from '../infrastructure/database/repository/scan.repository';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { EndpointAnalysisDetail, Finding, ReportService, ScanMeta } from '../infrastructure/report/report.service';
import { ScoreDetail, SecurityScoreService } from '../modules/blue/score/security-score.service';
import { AuthService } from '../modules/blue/web/auth/auth.service';
import { FingerprintService } from '../modules/blue/web/fingerprint/fingerprint.service';
import { PortscanService } from '../modules/red/network/portscan/portscan.service';
import { WebscanService } from '../modules/red/web/webscan/webscan.service';

@Injectable()
export class CliService {
  private prompt = inquirer.createPromptModule();
  private lastWebFindings: Finding[] = [];
  private lastPortFindings: Finding[] = [];
  private lastDiscoveredEndpoints: string[] = [];
  private lastAnalyzedEndpoints: string[] = [];
  private lastEndpointDetails: EndpointAnalysisDetail[] = [];
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
    private readonly scanRepository: ScanRepository,
  ) {}

  async start(): Promise<void> {
    this.showBanner();

    while (true) {
      const { mode } = await this.prompt([
        {
          type: 'select',
          name: 'mode',
          message: 'Selecione o modo de operação:',
          choices: [
            { name: chalk.red('🔴 Red Team'), value: 'red' },
            { name: chalk.blue('🔵 Blue Team'), value: 'blue' },
            { name: chalk.gray('🚪 Sair'), value: 'exit' },
          ],
        },
      ]);

      if (mode === 'exit') process.exit(0);

      if (mode === 'red') await this.handleRedTeam();
      if (mode === 'blue') await this.handleBlueTeam();
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

  private renderFindingSeverity(severity: Finding['severity']): string {
    if (severity === 'CRITICAL') return chalk.bgRed.white(severity);
    if (severity === 'HIGH') return chalk.red(severity);
    if (severity === 'MEDIUM') return chalk.yellow(severity);
    return chalk.gray(severity);
  }

  private renderFindingOrigin(finding: Finding): string {
    const scope = finding.category === 'portscan' ? 'PORT' : 'WEB';
    if (finding.team === 'RED') {
      return chalk.bgRed.white(`RED · ${scope}`);
    }
    return chalk.bgBlue.white(`BLUE · ${scope}`);
  }

  private printSectionHeader(title: string, description: string, color: 'red' | 'blue') {
    const colorFn = color === 'red' ? chalk.red : chalk.blue;
    console.log('\n');
    console.log(chalk.bold(colorFn(title)));
    console.log(chalk.gray(`${description}\n`));
  }

  private async handleRedTeam() {
    const { tool } = await this.prompt([
      {
        type: 'select',
        name: 'tool',
        message: chalk.red('MODO OFENSIVO:'),
        choices: [
          { name: '🔍 Port Scanner', value: 'port' },
          { name: '🌐 Web Scanner', value: 'web' },
          { name: '⬅️ Voltar', value: 'back' },
        ],
      },
    ]);

    if (tool === 'port') await this.runPortScan();
    if (tool === 'web') await this.runWebScan();
  }

  private async handleBlueTeam() {
    const { tool } = await this.prompt([
      {
        type: 'select',
        name: 'tool',
        message: chalk.blue('MODO DEFENSIVO:'),
        choices: [
          { name: '🕵️  Fingerprint', value: 'finger' },
          { name: '🔑 Auth Audit', value: 'auth' },
          { name: '📊 Security Score', value: 'score' },
          { name: '⬅️ Voltar', value: 'back' },
        ],
      },
    ]);

    if (tool === 'score') await this.runSecurityScore();
    if (tool === 'finger') await this.runFingerprintScan();
    if (tool === 'auth') await this.runAuthAudit();
  }

  private async runPortScan() {
    const { host, range } = await this.prompt([
      { type: 'input', name: 'host', message: 'Host:', default: '127.0.0.1' },
      { type: 'input', name: 'range', message: 'Range:', default: '1-1000' },
    ]);

    const [start, end] = range.split('-').map(Number);
    const openPorts = await this.portscanService.scanRange(host, start, end);

    this.lastPortFindings = openPorts.map((p) => ({
      type: 'Porta Aberta',
      evidence: `${p.port} (${p.service})`,
      team: 'RED',
      severity: 'LOW',
      category: 'portscan',
    }));

    await this.scanRepository.createFullScan(host, 0, 'PORT_SCAN', this.lastPortFindings);

    this.printSectionHeader(
      'PORT SCAN · SUPERFÍCIE DE REDE',
      'Varredura TCP concorrente e banner grabbing para identificar serviços expostos e versões visíveis.',
      'red',
    );

    const head = ['SEV.', 'ORIGEM', 'PORTA', 'SERVIÇO', 'BANNER'];
    const rows = openPorts.map((portInfo) => [
      chalk.bgRed.white('LOW'),
      chalk.bgRed.white('RED · PORT'),
      `${portInfo.port}/tcp`,
      portInfo.service,
      portInfo.banner || 'N/A',
    ]);
    console.log(this.formatter.formatTable(head, rows, 'red'));
  }

  private async runWebScan() {
    const { url } = await this.prompt([
      { type: 'input', name: 'url', message: 'URL:' },
    ]);

    this.lastTargetUrl = url;

    const scanResult = await this.webscanService.execute(url);
    this.lastDiscoveredEndpoints = scanResult.discoveredEndpoints ?? scanResult.endpoints;
    this.lastAnalyzedEndpoints = scanResult.analyzedEndpoints ?? [];
    this.lastEndpointDetails = scanResult.endpointDetails ?? [];

    this.lastWebFindings = scanResult.vulnerabilities.map((finding: any) => ({
      type: finding.type ?? 'Vulnerability',
      evidence: finding.evidence ?? finding.description ?? String(finding),
      severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(finding.severity)
        ? finding.severity
        : 'MEDIUM') as Finding['severity'],
      team: 'RED',
      category: (finding.category ?? 'webscan') as Finding['category'],
    }));

    await this.scanRepository.createFullScan(url, 0, 'WEB_SCAN', this.lastWebFindings, {
      endpointsAnalyzed: this.lastAnalyzedEndpoints.length,
      endpointsDiscovered: this.lastDiscoveredEndpoints.length,
      endpointsScanned: this.lastAnalyzedEndpoints.length,
      endpointDetails: this.lastEndpointDetails,
    });

    this.printSectionHeader(
      'WEB SCAN · ACHADOS DA SUPERFÍCIE',
      'Vulnerabilidades identificadas na superfície web, incluindo sinais de execução e exposição de conteúdo.',
      'red',
    );

    if (this.lastWebFindings.length > 0) {
      const head = ['SEV.', 'ORIGEM', 'ACHADO', 'EVIDÊNCIA'];
      const rows = this.lastWebFindings.map((f) => [
        this.renderFindingSeverity(f.severity),
        this.renderFindingOrigin(f),
        f.type,
        this.formatter.truncate(f.evidence, 80),
      ]);

      console.log('\n');
      console.log(this.formatter.formatTable(head, rows, 'red'));
    } else {
      console.log(chalk.green('\n✔ Nenhuma vulnerabilidade identificada no web scan.\n'));
    }

    this.logger.success(`Webscan concluído para ${url} — ${this.lastWebFindings.length} achado(s).`);
  }

  private async runFingerprintScan() {
    const { url } = await this.prompt([
      { type: 'input', name: 'url', message: 'URL:' },
    ]);

    const techs = await this.fingerprintService.identify(url);

    const findings: Finding[] = techs.map((t) => ({
      type: 'Tecnologia Detectada',
      evidence: `${t.name} (${t.category})${t.isRisk ? ' — Tecnologia com histórico de vulnerabilidades.' : ''}`,
      team: 'BLUE',
      severity: (t.isRisk ? 'MEDIUM' : 'LOW') as Finding['severity'],
      category: 'webscan',
    }));

    await this.scanRepository.createFullScan(url, 0, 'FINGERPRINT', findings);

    this.printSectionHeader(
      'FINGERPRINT · STACK TECNOLÓGICA',
      'Identificação de tecnologias expostas e sinais de risco observados na superfície HTTP.',
      'blue',
    );

    const head = ['SEV.', 'ORIGEM', 'TECNOLOGIA', 'CATEGORIA', 'RISCO'];
    const rows = techs.map((t) => [
      t.isRisk ? chalk.yellow('MEDIUM') : chalk.gray('LOW'),
      chalk.bgBlue.white('BLUE · WEB'),
      t.name,
      t.category,
      t.isRisk ? chalk.red('SIM') : chalk.green('NÃO'),
    ]);

    console.log(this.formatter.formatTable(head, rows, 'blue'));
  }

  private async runAuthAudit() {
    const { url } = await this.prompt([
      { type: 'input', name: 'url', message: 'URL:' },
    ]);

    const result = await this.authService.auditAuthentication(url);

    const authFindings: Finding[] = [
      {
        type: 'HTTPS',
        evidence: result.audit.hasHttps
          ? 'Conexão encriptada via TLS detectada.'
          : 'Site acessível via HTTP sem redirecionamento para HTTPS. Tráfego suscetível a interceptação (MitM).',
        team: 'BLUE',
        severity: (result.audit.hasHttps ? 'LOW' : 'HIGH') as Finding['severity'],
        category: 'webscan',
      },
      {
        type: 'CSRF Token',
        evidence: result.audit.hasCsrfToken
          ? 'Token anti-CSRF presente nos formulários.'
          : 'Nenhum token CSRF identificado. Formulários podem ser vulneráveis a Cross-Site Request Forgery.',
        team: 'BLUE',
        severity: (result.audit.hasCsrfToken ? 'LOW' : 'MEDIUM') as Finding['severity'],
        category: 'webscan',
      },
      {
        type: 'Cookie HttpOnly',
        evidence: result.audit.cookieSecurity.httpOnly
          ? 'Flag HttpOnly presente nos cookies de sessão.'
          : 'Cookies de sessão sem flag HttpOnly. Suscetíveis a roubo via XSS.',
        team: 'BLUE',
        severity: (result.audit.cookieSecurity.httpOnly ? 'LOW' : 'HIGH') as Finding['severity'],
        category: 'webscan',
      },
    ];

    await this.scanRepository.createFullScan(url, 0, 'AUTH_AUDIT', authFindings);

    this.printSectionHeader(
      'AUTH AUDIT · CONTROLES DE AUTENTICAÇÃO',
      'Verificação de HTTPS, proteção CSRF e flags de segurança dos cookies de sessão.',
      'blue',
    );

    const head = ['SEV.', 'ORIGEM', 'MÉTRICA', 'STATUS'];
    const rows = [
      [
        this.renderFindingSeverity(result.audit.hasHttps ? 'LOW' : 'HIGH'),
        chalk.bgBlue.white('BLUE · WEB'),
        'HTTPS',
        result.audit.hasHttps ? chalk.green('OK') : chalk.red('FALHA'),
      ],
      [
        this.renderFindingSeverity(result.audit.hasCsrfToken ? 'LOW' : 'MEDIUM'),
        chalk.bgBlue.white('BLUE · WEB'),
        'CSRF',
        result.audit.hasCsrfToken ? chalk.green('OK') : chalk.red('AUSENTE'),
      ],
      [
        this.renderFindingSeverity(result.audit.cookieSecurity.httpOnly ? 'LOW' : 'HIGH'),
        chalk.bgBlue.white('BLUE · WEB'),
        'HttpOnly',
        result.audit.cookieSecurity.httpOnly ? chalk.green('OK') : chalk.red('RISCO'),
      ],
      [
        this.renderFindingSeverity(result.audit.cookieSecurity.secure ? 'LOW' : 'MEDIUM'),
        chalk.bgBlue.white('BLUE · WEB'),
        'Secure',
        result.audit.cookieSecurity.secure ? chalk.green('OK') : chalk.red('RISCO'),
      ],
    ];

    console.log(this.formatter.formatTable(head, rows, 'blue'));
  }

  private async runSecurityScore() {
    const { url } = await this.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'URL:',
        default: this.lastTargetUrl,
      },
    ]);

    const result = await this.scoreService.calculateGlobalScore(url);

    const allFindings: Finding[] = [
      ...result.findings,
      ...this.lastWebFindings,
      ...this.lastPortFindings,
    ];

    const scoredResult = await this.scoreService.calculateGlobalScore(url, allFindings);

    const savedScan = await this.scanRepository.createFullScan(
      url,
      scoredResult.score,
      'FULL_SCORE',
      allFindings,
      {
        endpointsAnalyzed: this.lastAnalyzedEndpoints.length,
        endpointsDiscovered: this.lastDiscoveredEndpoints.length,
        endpointsScanned: this.lastAnalyzedEndpoints.length,
        endpointDetails: this.lastEndpointDetails,
      },
    );

    console.log(chalk.bold(`\nSCORE: ${savedScan.score}/100\n`));

    const head = ['SEV.', 'ORIGEM', 'ASPECTO', 'STATUS'];
    const rows = (scoredResult.details as ScoreDetail[]).map((d) => [
      d.passed
        ? chalk.green('OK')
        : d.severity === 'CRITICAL'
          ? chalk.bgRed.white(d.severity)
          : d.severity === 'HIGH'
            ? chalk.red(d.severity)
            : chalk.yellow(d.severity),
      d.aspect.startsWith('CVE') || d.aspect === 'HTTPS' || d.aspect === 'CSRF Token' || d.aspect === 'Cookie HttpOnly' || d.aspect === 'Cookie Secure'
        ? chalk.bgBlue.white('BLUE · WEB')
        : chalk.bgRed.white('RED · WEB'),
      d.aspect,
      d.status,
    ]);
    console.log(this.formatter.formatTable(head, rows, 'blue'));

    if (allFindings.length > 0) {
      const findingsHead = ['SEV.', 'ORIGEM', 'TIPO', 'EVIDÊNCIA'];
      const findingsRows = allFindings.map((finding) => [
        this.renderFindingSeverity(finding.severity),
        this.renderFindingOrigin(finding),
        finding.type,
        this.formatter.truncate(finding.evidence, 80),
      ]);

      console.log('\n');
      console.log(this.formatter.formatTable(findingsHead, findingsRows, 'blue'));
    }

    if (scoredResult.scoreBreakdown) {
      const breakdownHead = ['BLOCO', 'IMPACTO'];
      const breakdownRows = [
        ['Headers', String(scoredResult.scoreBreakdown.headers)],
        ['Auth', String(scoredResult.scoreBreakdown.auth)],
        ['CVEs', String(scoredResult.scoreBreakdown.cves)],
        ['Findings', String(scoredResult.scoreBreakdown.findings)],
      ];

      console.log('\n');
      console.log(this.formatter.formatTable(breakdownHead, breakdownRows, 'blue'));
    }

    const { confirmPdf } = await this.prompt([
      {
        type: 'confirm',
        name: 'confirmPdf',
        message: 'Gerar PDF?',
        default: true,
      },
    ]);

    if (confirmPdf) {
      const meta: ScanMeta = {
        endpointsAnalyzed: this.lastAnalyzedEndpoints.length,
        endpointsDiscovered: this.lastDiscoveredEndpoints.length,
        endpointsScanned: this.lastAnalyzedEndpoints.length,
        headersAnalyzed: scoredResult.details.length,
        endpointDetails: this.lastEndpointDetails,
      };

      const filePath = await this.reportService.generatePdf(
        url,
        savedScan.score,
        allFindings,
        meta,
        savedScan.id,
      );
      this.logger.success(`Relatório salvo em: ${filePath}`);
    }
  }
}
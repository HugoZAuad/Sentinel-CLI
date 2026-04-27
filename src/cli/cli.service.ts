import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import { FormatterService } from '../core/formatter/formatter.service';
import { ScanRepository } from '../infrastructure/database/repository/scan.repository';
import { LoggerService } from '../infrastructure/logger/logger.service';
import { Finding, ReportService, ScanMeta } from '../infrastructure/report/report.service';
import { ScoreDetail, SecurityScoreService } from '../modules/blue/score/security-score.service';
import { AuthService } from '../modules/blue/web/auth/auth.service';
import { FingerprintService } from '../modules/blue/web/fingerprint/fingerprint.service';
import { PortscanService } from '../modules/red/network/portscan/portscan.service';
import { WebscanService } from '../modules/red/web/webscan/webscan.service';

@Injectable()
export class CliService {
  private prompt = inquirer.createPromptModule();
  private lastWebFindings: Finding[] = [];
  private lastDiscoveredEndpoints: string[] = [];
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
      mode === 'red' ? await this.handleRedTeam() : await this.handleBlueTeam();
    }
  }

  private showBanner() {
    console.clear();
    console.log(
      chalk.red(`
    ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
    ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
    ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
    ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
    ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
    ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
    `),
    );
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
          { name: '📊 Security Score & PDF', value: 'score' },
          { name: '🕵️  Fingerprint', value: 'finger' },
          { name: '🔑 Auth Audit', value: 'auth' },
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
    const scanStart = Date.now();
    const openPorts = await this.portscanService.scanRange(host, start, end);
    const duration = `${((Date.now() - scanStart) / 1000).toFixed(1)}s`;

    await this.scanRepository.createNetworkScan(host, start, end, openPorts);

    console.log('\n');
    const head = ['PORTA', 'SERVIÇO', 'BANNER'];
    const rows = openPorts.map((p) => [p.port, p.service, p.banner || 'N/A']);
    console.log(this.formatter.formatTable(head, rows, 'red'));

    const { confirmPdf } = await this.prompt([
      {
        type: 'confirm',
        name: 'confirmPdf',
        message: 'Gerar PDF do mapeamento de rede?',
        default: true,
      },
    ]);

    if (confirmPdf) {
      // Marca como risco portas que não são HTTP/HTTPS básico
      const riskyPorts = new Set([21, 23, 25, 3306, 5432, 27017, 6379, 9200, 8888, 4444]);

      const portFindings: Finding[] = openPorts
        .filter((p) => riskyPorts.has(p.port) || (p.banner && p.banner !== 'N/A'))
        .map((p) => ({
          type: `Porta ${p.port}/tcp aberta — ${p.service}`,
          evidence: p.banner && p.banner !== 'N/A'
            ? `Banner capturado: "${p.banner}". Verifique se este serviço deve estar exposto e se a versão está atualizada.`
            : `Serviço ${p.service} identificado na porta ${p.port}. Avalie a necessidade de exposição pública e aplique restrição por firewall.`,
          severity: riskyPorts.has(p.port) ? 'HIGH' : 'MEDIUM',
          team: 'RED' as const,
          category: 'portscan' as const,
        }));

      const meta: ScanMeta = {
        portsScanned: end - start + 1,
        duration,
        openPorts: openPorts.map((p) => ({
          port: p.port,
          service: p.service,
          version: p.banner && p.banner !== 'N/A' ? p.banner.substring(0, 60) : undefined,
        })),
      };

      const portScore = Math.max(0, 100 - portFindings.length * 5);
      const filePath = await this.reportService.generatePdf(host, portScore, portFindings, meta);
      this.logger.success(`Relatório de rede salvo em: ${filePath}`);
    }
  }

  private async runWebScan() {
    const { url } = await this.prompt([
      { type: 'input', name: 'url', message: 'URL:' },
    ]);
    this.lastTargetUrl = url;

    const scanResult = await this.webscanService.execute(url);
    this.lastDiscoveredEndpoints = scanResult.endpoints;

    this.lastWebFindings = scanResult.findings.map((f: any) => ({
      type: f.type ?? 'Vulnerability',
      evidence: f.evidence ?? f.description ?? String(f),
      severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(f.severity)
        ? f.severity
        : 'MEDIUM') as Finding['severity'],
      team: 'RED' as const,
      category: 'webscan' as const,
    }));

    await this.scanRepository.createFullScan(url, 0, 'WEB_SCAN', this.lastWebFindings);

    if (this.lastWebFindings.length > 0) {
      const head = ['SEVERIDADE', 'AMEAÇA / CVE', 'EVIDÊNCIA'];
      const rows = this.lastWebFindings.map((f) => [
        f.severity === 'CRITICAL'
          ? chalk.bgRed.white(f.severity)
          : f.severity === 'HIGH'
            ? chalk.red(f.severity)
            : f.severity === 'MEDIUM'
              ? chalk.yellow(f.severity)
              : chalk.gray(f.severity),
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
      team: 'BLUE' as const,
      severity: t.isRisk ? 'MEDIUM' : 'LOW',
      category: 'webscan' as const,
    }));

    await this.scanRepository.createFullScan(url, 0, 'FINGERPRINT', findings);

    const head = ['TECNOLOGIA', 'CATEGORIA', 'RISCO'];
    const rows = techs.map((t) => [
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

    const findings: Finding[] = [
      {
        type: 'HTTPS',
        evidence: result.audit.hasHttps
          ? 'Conexão encriptada via TLS detectada.'
          : 'Site acessível via HTTP sem redirecionamento para HTTPS. Tráfego suscetível a interceptação (MitM).',
        team: 'BLUE',
        severity: result.audit.hasHttps ? 'LOW' : 'HIGH',
        category: 'webscan',
      },
      {
        type: 'CSRF Token',
        evidence: result.audit.hasCsrfToken
          ? 'Token anti-CSRF presente nos formulários.'
          : 'Nenhum token CSRF identificado. Formulários podem ser vulneráveis a Cross-Site Request Forgery.',
        team: 'BLUE',
        severity: result.audit.hasCsrfToken ? 'LOW' : 'MEDIUM',
        category: 'webscan',
      },
      {
        type: 'Cookie HttpOnly',
        evidence: result.audit.cookieSecurity.httpOnly
          ? 'Flag HttpOnly presente nos cookies de sessão.'
          : 'Cookies de sessão sem flag HttpOnly. Suscetíveis a roubo via XSS.',
        team: 'BLUE',
        severity: result.audit.cookieSecurity.httpOnly ? 'LOW' : 'HIGH',
        category: 'webscan',
      },
    ];

    await this.scanRepository.createFullScan(url, 0, 'AUTH_AUDIT', findings);

    const head = ['MÉTRICA', 'STATUS'];
    const rows = [
      ['HTTPS',    result.audit.hasHttps                  ? chalk.green('OK') : chalk.red('FALHA')],
      ['CSRF',     result.audit.hasCsrfToken              ? chalk.green('OK') : chalk.red('AUSENTE')],
      ['HttpOnly', result.audit.cookieSecurity.httpOnly   ? chalk.green('OK') : chalk.red('RISCO')],
      ['Secure',   result.audit.cookieSecurity.secure     ? chalk.green('OK') : chalk.red('RISCO')],
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
    ];

    const savedScan = await this.scanRepository.createFullScan(
      url,
      result.score,
      'FULL_SCORE',
      allFindings,
    );

    console.log(chalk.bold(`\nSCORE: ${result.score}/100\n`));

    const head = ['ASPECTO', 'STATUS', 'SEV.'];
    const rows = (result.details as ScoreDetail[]).map((d) => [
      d.aspect,
      d.status,
      d.passed
        ? chalk.green('OK')
        : d.severity === 'CRITICAL'
          ? chalk.bgRed.white(d.severity)
          : d.severity === 'HIGH'
            ? chalk.red(d.severity)
            : chalk.yellow(d.severity),
    ]);
    console.log(this.formatter.formatTable(head, rows, 'blue'));

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
        endpointsScanned: this.lastDiscoveredEndpoints.length,
        headersAnalyzed: result.details.length,
      };

      const filePath = await this.reportService.generatePdf(
        url,
        savedScan.score ?? result.score,
        allFindings,
        meta,
      );
      this.logger.success(`Relatório salvo em: ${filePath}`);
    }
  }
}
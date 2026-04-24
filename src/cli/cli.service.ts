import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { SecurityScoreService } from '../modules/blue/score/security-score.service';
import { PortscanService } from '../modules/red/network/portscan/portscan.service';
import { WebscanService } from '../modules/red/web/webscan/webscan.service';
import { saveReport } from '../shared/utils/report.util';

@Injectable()
export class CliService {
  private prompt = inquirer.createPromptModule();

  constructor(
    private readonly portscanService: PortscanService,
    private readonly webscanService: WebscanService,
    private readonly scoreService: SecurityScoreService,
  ) {}

  async start(): Promise<void> {
    this.showBanner();
    while (true) {
      const { mode } = await this.prompt([{
        type: 'select',
        name: 'mode',
        message: chalk.cyan('Selecione o modo de operação:'),
        choices: [
          { name: chalk.red('🔴 Red Team (Ofensivo)'), value: 'red' },
          { name: chalk.blue('🔵 Blue Team (Defensivo)'), value: 'blue' },
          { name: chalk.gray('🚪 Sair'), value: 'exit' },
        ],
      }]);

      if (mode === 'exit') {
        console.log(chalk.yellow('\n[!] Encerrando Sentinel.\n'));
        return; 
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
    console.log(chalk.gray('    --- Security Recon & Audit Platform | v1.0.0 ---\n'));
  }

  private async handleRedTeam() {
    const { tool } = await this.prompt([{
      type: 'select',
      name: 'tool',
      message: chalk.red('FERRAMENTAS RED TEAM:'),
      choices: [
        { name: '🔍 Port Scanner', value: 'port' },
        { name: '🌐 Web Scanner', value: 'web' },
        { name: '⬅️ Voltar', value: 'back' },
      ],
    }]);

    if (tool === 'port') await this.runPortScanInteractive();
    if (tool === 'web') await this.runWebScanInteractive();
  }

  private async handleBlueTeam() {
    const { tool } = await this.prompt([{
      type: 'select',
      name: 'tool',
      message: chalk.blue('FERRAMENTAS BLUE TEAM:'),
      choices: [
        { name: '📊 Security Score', value: 'score' },
        { name: '⬅️ Voltar', value: 'back' },
      ],
    }]);

    if (tool === 'score') console.log(chalk.yellow('\n[!] Módulo em integração.\n'));
  }

  private async runPortScanInteractive() {
    const answers = await this.prompt([
      { type: 'input', name: 'host', message: 'Host:' },
      { type: 'input', name: 'start', message: 'Porta Inicial:', default: '1' },
      { type: 'input', name: 'end', message: 'Porta Final:', default: '1024' },
    ]);

    const total = Number(answers.end) - Number(answers.start) + 1;
    const bar = new cliProgress.SingleBar({
      format: 'Progresso |' + chalk.red('{bar}') + '| {percentage}%',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    bar.start(total, 0);
    let count = 0;
    const openPorts = await this.portscanService.scanRange(answers.host, Number(answers.start), Number(answers.end), () => {
      count++;
      bar.update(count);
    });
    bar.stop();

    const table = new Table({ head: [chalk.red('PORTA'), chalk.red('SERVIÇO')] });
    openPorts.forEach(item => table.push([item.port, item.service]));
    console.log(table.toString());
    saveReport(`portscan-${answers.host}`, openPorts);
  }

  private async runWebScanInteractive() {
    const { url } = await this.prompt([{ type: 'input', name: 'url', message: 'URL Alvo:' }]);
    try {
      const result = await this.webscanService.scan(url);
      console.log(chalk.green(`\n✔ Scan completo: ${result.url}`));
      saveReport(`webscan-${url.replace(/[^a-z0-9]/gi, '_')}`, result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.log(chalk.red(`\n[X] Erro: ${message}`));
    }
  }
}
import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { PortscanService } from '../modules/network/portscan/portscan.service';
import { WebscanService } from '../modules/web/webscan/webscan.service';
import { saveReport } from '../shared/utils/report.util';

const prompt = inquirer.createPromptModule();

@Injectable()
export class CliService {
  constructor(
    private readonly portscanService: PortscanService,
    private readonly webscanService: WebscanService,
  ) {}

  async start(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length > 0) {
      return this.handleCommand(args);
    }

    while (true) {
      const option = await this.showMenu();

      if (option === 'exit') {
        console.log(chalk.yellow('\n👋 Encerrando aplicação...\n'));
        process.exit(0);
      }

      if (option === 'port') {
        await this.handlePortScanInteractive();
      }

      if (option === 'web') {
        await this.handleWebScan();
      }
    }
  }

  async showMenu(): Promise<string> {
    const answer = await prompt([
      {
        type: 'select',
        name: 'option',
        message: chalk.cyan('Escolha uma opção:'),
        choices: [
          { name: '🔍 Port Scanner', value: 'port' },
          { name: '🌐 Web Scanner', value: 'web' },
          { name: '🚪 Sair', value: 'exit' },
        ],
      },
    ]);

    return answer.option;
  }

  async handleCommand(args: string[]) {
    const command = args[0];

    switch (command) {
      case 'portscan': {
        const host = args[1];
        const start = Number(args[2] || 1);
        const end = Number(args[3] || 1024);

        if (!host) {
          console.log(chalk.red('❌ Informe o host'));
          return;
        }

        await this.runPortScan(host, start, end);
        return;
      }

      case 'webscan': {
        const url = args[1];

        if (!url) {
          console.log(chalk.red('❌ Informe a URL'));
          return;
        }

        await this.runWebScan(url);
        return;
      }

      default:
        console.log(chalk.red('❌ Comando desconhecido'));
    }
  }

  async handlePortScanInteractive() {
    const answers = await prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Host (IP ou domínio):',
      },
      {
        type: 'input',
        name: 'start',
        message: 'Porta inicial:',
        default: '1',
      },
      {
        type: 'input',
        name: 'end',
        message: 'Porta final:',
        default: '1024',
      },
    ]);

    await this.runPortScan(
      answers.host,
      Number(answers.start),
      Number(answers.end),
    );
  }

  async runPortScan(host: string, start: number, end: number) {
    console.log(chalk.blue(`\n🔍 Escaneando ${host}...\n`));

    const totalPorts = end - start + 1;

    const bar = new cliProgress.SingleBar(
      {
        format: 'Scanning [{bar}] {percentage}% | {value}/{total}',
      },
      cliProgress.Presets.shades_classic
    );

    bar.start(totalPorts, 0);

    let current = 0;

    const openPorts = await this.portscanService.scanRange(
      host,
      start,
      end,
      () => {
        current++;
        bar.update(current);
      }
    );

    bar.stop();

    console.log(chalk.green('\n✔ Resultado final:\n'));

    if (openPorts.length === 0) {
      console.log(chalk.red('Nenhuma porta aberta encontrada.'));
      return;
    }

    const table = new Table({
      head: ['PORT', 'SERVICE', 'BANNER'],
      colWidths: [10, 20, 60],
      wordWrap: true,
    });

    openPorts.forEach((item) => {
      const banner = item.banner
        ? item.banner.replace(/\s+/g, ' ').slice(0, 100)
        : 'No banner';

      table.push([
        chalk.green(item.port),
        chalk.yellow(item.service),
        chalk.gray(banner),
      ]);
    });

    console.log(table.toString());

    const file = saveReport(`portscan-${host}`, openPorts);
    console.log(chalk.gray(`\nRelatório salvo em: ${file}`));
  }

  async handleWebScan() {
    const answers = await prompt([
      {
        type: 'input',
        name: 'url',
        message: 'URL:',
      },
    ]);

    await this.runWebScan(answers.url);
  }

  async runWebScan(url: string) {
    console.log(chalk.blue(`\n🌐 Escaneando ${url}...\n`));

    const result = await this.webscanService.scan(url);

    if ('error' in result) {
      console.log(chalk.red(result.error));
      return;
    }

    console.log(chalk.green('✔ Status:'), result.status);
    console.log(chalk.gray('Tempo:'), result.time);
    console.log(chalk.blue('HTTPS:'), result.https ? 'Sim' : 'Não');

    console.log('\n🔗 Links encontrados:', result.links.length);
    console.log('🚪 Endpoints encontrados:', result.endpoints.length);

    console.log('\n🧪 Form Scanner:');

    if (!result.forms || result.forms.length === 0) {
      console.log(chalk.green('Nenhuma vulnerabilidade em formulários'));
    } else {
      result.forms.forEach(f => {
        console.log(`\n🎯 ${f.action}`);
        f.findings.forEach((x: string) =>
          console.log(chalk.red(`- ${x}`))
        );
      });
    }

    const file = saveReport(
      `webscan-${url.replace(/[:/.]/g, '_')}`,
      result
    );

    console.log(chalk.gray(`\nRelatório salvo em: ${file}`));
  }
}
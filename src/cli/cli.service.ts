import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { PortscanService } from '../modules/red/portscan/portscan.service';

const prompt = inquirer.createPromptModule();

@Injectable()
export class CliService {
  constructor(private readonly portscanService: PortscanService) {}

  async start(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length > 0) {
      return this.handleCommand(args);
    }

    while (true) {
      const option = await this.showMenu();

      if (option === 'exit') {
        console.log(chalk.yellow('\n👋 Encerrando aplicação...\n'));
        return;
      }

      if (option === 'port') {
        await this.handlePortScanInteractive();
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
      cliProgress.Presets.shades_classic,
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
      },

      (data) => {
        bar.stop(); // pausa a barra

        console.log(
          chalk.green(`🟢 ${data.port} | ${data.service}`) +
            chalk.gray(` | ${data.banner}`),
        );

        bar.start(totalPorts, current); // recria a barra no estado atual
      },
    );

    bar.stop();

    console.log(chalk.green('\n✔ Resultado final:\n'));

    if (openPorts.length === 0) {
      console.log(chalk.red('Nenhuma porta aberta encontrada.'));
      return;
    }

    const table = new Table({
      head: ['PORT', 'SERVICE', 'BANNER'],
    });

    openPorts.forEach((item) => {
      table.push([
        chalk.green(item.port),
        chalk.yellow(item.service),
        chalk.gray(item.banner),
      ]);
    });

    console.log(table.toString());
  }
}

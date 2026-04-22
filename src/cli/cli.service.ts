import { Injectable } from '@nestjs/common';
import inquirer from 'inquirer';
import { PortscanService } from '../modules/red/portscan/portscan.service';

const prompt = inquirer.createPromptModule();

@Injectable()
export class CliService {
  constructor(
    private readonly portscanService: PortscanService,
  ) {}

  async start(): Promise<void> {
    while (true) {
      const option = await this.showMenu();

      if (option === 'exit') {
        console.log('\n👋 Encerrando aplicação...\n');
        return;
      }

      if (option === 'port') {
        await this.handlePortScan();
      }
    }
  }

  async showMenu(): Promise<string> {
    const answer = await prompt([
      {
        type: 'select',
        name: 'option',
        message: 'Escolha uma opção:',
        choices: [
          { name: 'Port Scanner', value: 'port' },
          { name: 'Sair', value: 'exit' },
        ],
      },
    ]);

    return answer.option;
  }

  async handlePortScan() {
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

    console.log('\n🔍 Escaneando...\n');

    const openPorts = await this.portscanService.scanRange(
      answers.host,
      Number(answers.start),
      Number(answers.end),
    );

    console.log('\n✅ Resultado:\n');

    if (openPorts.length === 0) {
      console.log('Nenhuma porta aberta encontrada.');
    } else {
      console.log('PORT\tSERVICE');
      console.log('---------------------');

      openPorts.forEach((item) => {
        console.log(`${item.port}\t${item.service}`);
      });
    }

    await prompt([
      {
        type: 'input',
        name: 'pause',
        message: 'Pressione ENTER para voltar ao menu',
      },
    ]);
  }
}
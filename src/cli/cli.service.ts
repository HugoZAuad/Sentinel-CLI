import { Injectable } from '@nestjs/common';
import { showMainMenu } from './menu';

@Injectable()
export class CliService {
  async start() {
    let running = true;

    while (running) {
      const option = await showMainMenu();

      switch (option) {
        case 'Red Team':
          console.log('Entrando em Red Team...');
          break;

        case 'Blue Team':
          console.log('Entrando em Blue Team...');
          break;

        case 'Sair':
          running = false;
          break;
      }
    }
  }
}
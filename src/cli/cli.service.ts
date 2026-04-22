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
          console.log('Entering Red Team...');
          break;

        case 'Blue Team':
          console.log('Entering Blue Team...');
          break;

        case 'Exit':
          running = false;
          break;
      }
    }
  }
}
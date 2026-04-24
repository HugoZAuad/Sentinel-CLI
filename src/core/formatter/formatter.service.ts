import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import Table from 'cli-table3';

@Injectable()
export class FormatterService {
  formatTable(head: string[], rows: any[][], color: 'red' | 'blue' | 'green' = 'red'): string {
    const tableColor = color === 'red' ? 'red' : color === 'blue' ? 'cyan' : 'green';
    
    const table = new Table({
      head: head.map(h => chalk[tableColor](h)),
      style: {
        head: [], 
        border: ['gray'],
      },
      wordWrap: true,
    });

    table.push(...rows);
    return table.toString();
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  truncate(text: string, length = 50): string {
    if (!text) return 'N/A';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
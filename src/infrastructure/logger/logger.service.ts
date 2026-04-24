import { Injectable } from '@nestjs/common';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

@Injectable()
export class LoggerService {
  private spinner: Ora | null = null;

  log(message: string): void {
    console.log(`${chalk.blue('ℹ')} ${message}`);
  }

  success(message: string): void {
    console.log(`${chalk.green('✔')} ${message}`);
  }

  warn(message: string): void {
    console.log(`${chalk.yellow('⚠')} ${message}`);
  }

  error(message: string, error?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`${chalk.red('✖')} ${chalk.red(message)} ${error ? chalk.gray(`(${errorMessage})`) : ''}`);
  }

  startTask(message: string): void {
    if (this.spinner) this.spinner.stop();
    this.spinner = ora({
      text: chalk.cyan(message),
      color: 'cyan',
    }).start();
  }

  stopTask(message?: string, status: 'success' | 'error' | 'warn' = 'success'): void {
    if (!this.spinner) return;

    if (status === 'success') {
      this.spinner.succeed(chalk.green(message || this.spinner.text));
    } else if (status === 'error') {
      this.spinner.fail(chalk.red(message || this.spinner.text));
    } else {
      this.spinner.warn(chalk.yellow(message || this.spinner.text));
    }

    this.spinner = null;
  }

  info(message: string): void {
    console.log(chalk.gray(`[INFO] ${message}`));
  }
}